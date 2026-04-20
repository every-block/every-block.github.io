import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import Papa from "papaparse";

const VERSION = "26.1.1";
const REPO_URL = "https://github.com/InventivetalentDev/minecraft-assets.git";

const CSV_PATH = "public/data/blocks.csv";
const MANIFEST_PATH = "public/data/item-sprites.json";
const SPRITES_DIR_REL = "sprites";
const SPRITES_DIR_ABS = join("public", SPRITES_DIR_REL);
const OVERRIDES_PATH = "scripts/item-sprite-overrides.json";

interface ItemSpriteEntry {
  path: string;
  frameHeight?: number;
}

type Manifest = Record<string, ItemSpriteEntry>;

type TextureKind = "block" | "item";
interface ResolvedRef {
  kind: TextureKind;
  name: string;
}

const FLAT_ITEM_PARENTS = new Set<string>([
  "item/generated",
  "item/handheld",
  "item/handheld_rod",
  "item/handheld_mace",
  "item/generated_layered",
  "builtin/generated",
]);

const TEXTURE_PRIORITY = [
  "layer0",
  "all",
  "side",
  "cross",
  "wall",
  "fan",
  "front",
  "texture",
  "end",
  "top",
  "particle",
];

const MAX_WALK_DEPTH = 12;

const UNUSABLE_SPECIAL_BASES = new Set<string>([
  "item/template_banner",
  "minecraft:item/template_banner",
]);

await main();

interface Ctx {
  assetsRoot: string;
  jsonCache: Map<string, Promise<any | null>>;
  copyCache: Map<string, Promise<ItemSpriteEntry | null>>;
}

async function main(): Promise<void> {
  const started = Date.now();
  const force = process.argv.includes("--force") || process.env.FORCE === "1";
  if (!force && (await alreadyBuilt())) {
    console.log(
      `sprites already present (${MANIFEST_PATH}); use --force to rebuild?`,
    );
    return;
  }

  const assetsRoot = await ensureClone();
  const [ids, overrides] = await Promise.all([parseIds(), loadOverrides()]);

  if (existsSync(SPRITES_DIR_ABS)) {
    await rm(SPRITES_DIR_ABS, { recursive: true, force: true });
  }
  await mkdir(SPRITES_DIR_ABS, { recursive: true });

  const ctx: Ctx = {
    assetsRoot,
    jsonCache: new Map(),
    copyCache: new Map(),
  };

  const results = await Promise.all(
    ids.map(async (id) => ({ id, res: await resolveOne(ctx, id, overrides) })),
  );

  const manifest: Manifest = {};
  const unresolved: string[] = [];
  for (const { id, res } of results) {
    if (res.ok) manifest[id] = res.value;
    else unresolved.push(`${id} (${res.reason})`);
  }

  const sorted: Manifest = {};
  for (const k of Object.keys(manifest).sort()) sorted[k] = manifest[k];
  await writeFile(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + "\n");

  const copiedEntries = (await Promise.all(ctx.copyCache.values())).filter(
    (e): e is ItemSpriteEntry => e !== null,
  );
  const sizes = await Promise.all(
    copiedEntries.map(async (e) => {
      try {
        return (await stat(join("public", e.path))).size;
      } catch {
        return 0;
      }
    }),
  );
  const totalBytes = sizes.reduce((a, b) => a + b, 0);

  console.log("");
  console.log(`resolved: ${Object.keys(manifest).length} / ${ids.length}`);
  console.log(
    `copied:   ${copiedEntries.length} unique textures (${(totalBytes / 1024).toFixed(
      1,
    )} KiB) -> ${SPRITES_DIR_ABS}`,
  );
  console.log(`manifest: ${MANIFEST_PATH}`);
  console.log(`elapsed:  ${((Date.now() - started) / 1000).toFixed(1)}s`);
  if (unresolved.length) {
    unresolved.sort();
    console.warn(`unresolved (${unresolved.length}):`);
    for (const u of unresolved) console.warn(`  - ${u}`);
    console.warn(
      `might need manual mappings to ${OVERRIDES_PATH} (id -> "block/foo" or "item/foo")`,
    );
  }
}

type Resolution =
  | { ok: true; value: ItemSpriteEntry }
  | { ok: false; reason: string };

async function resolveOne(
  ctx: Ctx,
  id: string,
  overrides: Record<string, string>,
): Promise<Resolution> {
  const override = overrides[id];
  if (override) {
    const tex = parseRef(override);
    if (!tex) return { ok: false, reason: `bad override "${override}"` };
    const entry = await copyTexture(ctx, tex);
    if (!entry) {
      return {
        ok: false,
        reason: `override png missing: textures/${tex.kind}/${tex.name}.png`,
      };
    }
    return { ok: true, value: entry };
  }

  const itemDef = await loadJson(
    ctx,
    join(ctx.assetsRoot, "minecraft", "items", `${id}.json`),
  );
  if (!itemDef) {
    return { ok: false, reason: `no items/${id}.json` };
  }
  const rootModel = pickItemRootModel(itemDef.model);
  if (!rootModel) {
    return { ok: false, reason: "unsupported item-model shape" };
  }
  const tex = await resolveFlatTexture(ctx, rootModel);
  if (!tex) {
    return { ok: false, reason: "no flat texture found walking model chain" };
  }
  const entry = await copyTexture(ctx, tex);
  if (!entry) {
    return {
      ok: false,
      reason: `texture png missing: textures/${tex.kind}/${tex.name}.png`,
    };
  }
  return { ok: true, value: entry };
}

async function resolveFlatTexture(
  ctx: Ctx,
  startModelRef: string,
): Promise<ResolvedRef | null> {
  const merged = new Map<string, string>();
  let current = parseRef(startModelRef);
  let depth = 0;
  while (current && depth < MAX_WALK_DEPTH) {
    depth++;
    const model = await loadJson(
      ctx,
      join(ctx.assetsRoot, "minecraft", "models", current.kind, `${current.name}.json`),
    );
    if (!model) break;
    if (model.textures && typeof model.textures === "object") {
      for (const [k, v] of Object.entries(model.textures)) {
        if (merged.has(k)) continue;
        const s = textureValueToString(v);
        if (s !== null) merged.set(k, s);
      }
    }
    if (Array.isArray(model.elements)) break;
    const parent =
      typeof model.parent === "string" ? stripNs(model.parent) : null;
    if (!parent || FLAT_ITEM_PARENTS.has(parent)) break;
    const next = parseRef(parent);
    if (!next) break;
    current = next;
  }

  for (const key of TEXTURE_PRIORITY) {
    const v = merged.get(key);
    if (v !== undefined) {
      const resolved = deref(merged, v);
      if (resolved) return resolved;
    }
  }
  for (const v of merged.values()) {
    const resolved = deref(merged, v);
    if (resolved) return resolved;
  }
  return null;
}

function deref(
  textures: Map<string, string>,
  value: string,
): ResolvedRef | null {
  const seen = new Set<string>();
  let v = value;
  while (v.startsWith("#")) {
    const key = v.slice(1);
    if (seen.has(key)) return null;
    seen.add(key);
    const next = textures.get(key);
    if (next === undefined) return null;
    v = next;
  }
  return parseRef(v);
}

function pickItemRootModel(model: unknown): string | null {
  if (!model || typeof model !== "object") return null;
  const m = model as Record<string, unknown>;
  const type = typeof m.type === "string" ? stripNs(m.type) : null;
  // `special` items (banners, beds, shulker boxes, heads, chests) have a
  // `base` item-model thats used as the flat fallback in the inventory
  if (type === "special" && typeof m.base === "string") {
    if (UNUSABLE_SPECIAL_BASES.has(m.base)) return null;
    return m.base;
  }
  // `composite` bundles several sub-models, use first
  if (type === "composite" && Array.isArray(m.models)) {
    for (const sub of m.models) {
      const r = pickItemRootModel(sub);
      if (r) return r;
    }
  }
  if (typeof m.model === "string") return m.model;
  if (Array.isArray(m.cases)) {
    for (const c of m.cases) {
      const r = pickItemRootModel((c as { model?: unknown }).model);
      if (r) return r;
    }
  }
  if (Array.isArray(m.entries)) {
    for (const e of m.entries) {
      const r = pickItemRootModel((e as { model?: unknown }).model);
      if (r) return r;
    }
  }
  if (m.on_true || m.on_false) {
    return (
      pickItemRootModel(m.on_true) ?? pickItemRootModel(m.on_false) ?? null
    );
  }
  if (m.fallback) return pickItemRootModel(m.fallback);
  return null;
}

function copyTexture(
  ctx: Ctx,
  tex: ResolvedRef,
): Promise<ItemSpriteEntry | null> {
  const cacheKey = `${tex.kind}/${tex.name}`;
  const existing = ctx.copyCache.get(cacheKey);
  if (existing) return existing;
  const p = doCopyTexture(ctx, tex);
  ctx.copyCache.set(cacheKey, p);
  return p;
}

async function doCopyTexture(
  ctx: Ctx,
  tex: ResolvedRef,
): Promise<ItemSpriteEntry | null> {
  const srcPng = join(
    ctx.assetsRoot,
    "minecraft",
    "textures",
    tex.kind,
    `${tex.name}.png`,
  );
  if (!existsSync(srcPng)) return null;

  const destRel = `${SPRITES_DIR_REL}/${tex.kind}/${tex.name}.png`;
  const destAbs = join("public", destRel);
  await mkdir(dirname(destAbs), { recursive: true });

  const mcmetaPath = `${srcPng}.mcmeta`;
  const hasMcmeta = existsSync(mcmetaPath);
  const [, metaText] = await Promise.all([
    copyFile(srcPng, destAbs),
    hasMcmeta ? readFile(mcmetaPath, "utf8").catch(() => null) : Promise.resolve(null),
  ]);

  let frameHeight: number | undefined;
  if (metaText) {
    try {
      const meta = JSON.parse(metaText);
      if (meta && typeof meta === "object" && "animation" in meta) {
        frameHeight = 16;
      }
    } catch {
      // malformed mcmeta -> static
    }
  }

  return frameHeight !== undefined
    ? { path: destRel, frameHeight }
    : { path: destRel };
}

function textureValueToString(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.sprite === "string") return o.sprite;
    if (typeof o.texture === "string") return o.texture;
  }
  return null;
}

function parseRef(ref: string): ResolvedRef | null {
  const s = stripNs(ref);
  const slash = s.indexOf("/");
  if (slash < 0) {
    return { kind: "block", name: s };
  }
  const kind = s.slice(0, slash);
  const name = s.slice(slash + 1);
  if (kind !== "block" && kind !== "item") return null;
  return { kind, name };
}

function stripNs(s: string): string {
  return s.replace(/^minecraft:/, "");
}

function loadJson(ctx: Ctx, path: string): Promise<any | null> {
  const cached = ctx.jsonCache.get(path);
  if (cached) return cached;
  const p = doLoadJson(path);
  ctx.jsonCache.set(path, p);
  return p;
}

async function doLoadJson(path: string): Promise<any | null> {
  try {
    const text = await readFile(path, "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function parseIds(): Promise<string[]> {
  const text = await readFile(CSV_PATH, "utf8");
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const row of parsed.data) {
    const raw = row["ID"];
    if (typeof raw !== "string") continue;
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

async function loadOverrides(): Promise<Record<string, string>> {
  try {
    const text = await readFile(OVERRIDES_PATH, "utf8");
    const json = JSON.parse(text);
    if (json && typeof json === "object") return json as Record<string, string>;
  } catch {
    // no overrides -> empty
  }
  return {};
}

async function alreadyBuilt(): Promise<boolean> {
  if (!existsSync(MANIFEST_PATH)) return false;
  if (!existsSync(SPRITES_DIR_ABS)) return false;
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
}

async function ensureClone(): Promise<string> {
  const cacheDir = join(tmpdir(), `minecraft-assets-${VERSION}`);
  const assetsDir = join(cacheDir, "assets");
  if (existsSync(join(assetsDir, "minecraft", "items"))) {
    console.log(`using cached clone at ${cacheDir}`);
    return assetsDir;
  }
  if (existsSync(cacheDir)) {
    await rm(cacheDir, { recursive: true, force: true });
  }
  console.log(`cloning ${REPO_URL} @ ${VERSION} -> ${cacheDir}`);
  await runGit(["clone", "--depth", "1", "--branch", VERSION, REPO_URL, cacheDir]);
  return assetsDir;
}

function runGit(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`git ${args.join(" ")} exited with ${code}`));
    });
  });
}
