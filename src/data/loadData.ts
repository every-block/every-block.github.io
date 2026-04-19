import Papa from "papaparse";
import type { Block, DataBundle, Response, Rgb, Vote } from "./types";
import { VOTE_REMAP_BY_KEY } from "./voteRemap";
import { buildGroupClassifier } from "./blockGroups";

const RESPONSES_URL = "/data/responses.csv";
const BLOCKS_URL = "/data/blocks.csv";

const TIMESTAMP_KEYS = ["timestamp", "time", "date", "submitted at"];
const RESPONSE_BLOCK_KEYS = [
  "block",
  "favorite block",
  "favourite block",
  "favorite",
  "favourite",
  "answer",
];

const BLOCK_NAME_KEYS = ["name", "block", "block name", "item"];
const BLOCK_VERSION_KEYS = [
  "full version",
  "version",
  "release",
  "release version",
  "added",
];
const BLOCK_R_KEYS = ["r", "red"];
const BLOCK_G_KEYS = ["g", "green"];
const BLOCK_B_KEYS = ["b", "blue"];
const BLOCK_RGB_KEYS = ["rgb", "color", "colour", "hex"];
const BLOCK_IMAGE_KEYS = [
  "image",
  "image url",
  "image_url",
  "imageurl",
  "icon",
  "icon url",
  "img",
  "url",
];

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function pick(row: Record<string, unknown>, aliases: readonly string[]): string {
  const map = new Map<string, string>();
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string") map.set(normKey(k), v);
    else if (v != null) map.set(normKey(k), String(v));
  }
  for (const a of aliases) {
    const v = map.get(a);
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

function parseRgb(triple: string, hex: string): Rgb | null {
  if (triple) {
    const m = triple.match(/(\d+)\s*[,;\s]\s*(\d+)\s*[,;\s]\s*(\d+)/);
    if (m) {
      const r = clampByte(+m[1]);
      const g = clampByte(+m[2]);
      const b = clampByte(+m[3]);
      return [r, g, b];
    }
  }
  if (hex) {
    const h = hex.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(h)) {
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    if (/^[0-9a-fA-F]{3}$/.test(h)) {
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
      ];
    }
  }
  return null;
}

function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function blockKey(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_-]+/g, " ");
}

async function fetchCsv<T extends Record<string, unknown>>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to fetch ${url}: ${res.status}`);
  const text = await res.text();
  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors.length) {
    console.warn(`csv parse warnings for ${url}`, parsed.errors);
  }
  return parsed.data;
}

function parseBlocks(rows: Record<string, unknown>[]): Block[] {
  const out: Block[] = [];
  for (const row of rows) {
    const name = pick(row, BLOCK_NAME_KEYS).trim();
    if (!name) continue;
    const version = pick(row, BLOCK_VERSION_KEYS).trim();
    const r = pick(row, BLOCK_R_KEYS);
    const g = pick(row, BLOCK_G_KEYS);
    const b = pick(row, BLOCK_B_KEYS);
    const rgbField = pick(row, BLOCK_RGB_KEYS);
    let rgb: Rgb | null = null;
    if (r && g && b) {
      rgb = [clampByte(+r), clampByte(+g), clampByte(+b)];
    } else {
      rgb = parseRgb(rgbField, rgbField);
    }
    if (!rgb) {
      console.warn(`block "${name}" has no parseable rgb; defaulting to gray`);
      rgb = [128, 128, 128];
    }
    const imageUrl = pick(row, BLOCK_IMAGE_KEYS).trim();
    out.push({
      name,
      key: blockKey(name),
      version,
      rgb,
      imageUrl,
      image: null,
    });
  }
  return out;
}

function parseResponses(rows: Record<string, unknown>[]): Response[] {
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const tsKey = pickKey(headers, TIMESTAMP_KEYS);
  const blockKeyCol =
    pickKey(headers, RESPONSE_BLOCK_KEYS) ??
    headers.find((k) => /block|favo?u?rite/i.test(k)) ??
    headers.find((k) => k !== tsKey) ??
    null;

  if (!tsKey || !blockKeyCol) {
    console.warn(
      "responses.csv: couldn't find timestamp/block columns. headers:",
      headers,
    );
    return [];
  }

  const out: Response[] = [];
  for (const row of rows) {
    const ts = String(row[tsKey] ?? "").trim();
    const block = String(row[blockKeyCol] ?? "").trim();
    if (!ts || !block) continue;
    const t = parseTimestamp(ts);
    if (!Number.isFinite(t)) continue;
    out.push({ timestamp: t, rawBlock: block });
  }
  return out;
}

function pickKey(
  headers: string[],
  aliases: readonly string[],
): string | null {
  const norm = new Map<string, string>();
  for (const h of headers) norm.set(normKey(h), h);
  for (const a of aliases) {
    const k = norm.get(a);
    if (k !== undefined) return k;
  }
  return null;
}

function parseTimestamp(s: string): number {
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, y, mo, d, h, mi, se] = m;
    return Date.UTC(+y, +mo - 1, +d, +h, +mi, +(se ?? 0));
  }

  m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM|am|pm))?/,
  );
  if (m) {
    const [, mo, d, y, hRaw, mi, se, ampm] = m;
    let h = +hRaw;
    if (ampm) {
      const isPm = ampm.toUpperCase() === "PM";
      if (h === 12) h = isPm ? 12 : 0;
      else if (isPm) h += 12;
    }
    return Date.UTC(+y, +mo - 1, +d, h, +mi, +(se ?? 0));
  }

  const t = Date.parse(s);
  if (Number.isFinite(t)) return t;
  return NaN;
}

export function preloadImages(blocks: Block[], onProgress?: () => void): void {
  for (const block of blocks) {
    if (!block.imageUrl) {
      block.image = false;
      continue;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      block.image = img;
      onProgress?.();
    };
    img.onerror = () => {
      const retry = new Image();
      retry.onload = () => {
        block.image = retry;
        onProgress?.();
      };
      retry.onerror = () => {
        console.warn(`failed to load icon for "${block.name}" (${block.imageUrl})`);
        block.image = false;
        onProgress?.();
      };
      retry.src = block.imageUrl;
    };
    img.src = block.imageUrl;
  }
}

export async function loadData(): Promise<DataBundle> {
  const [blockRows, responseRows] = await Promise.all([
    fetchCsv<Record<string, unknown>>(BLOCKS_URL),
    fetchCsv<Record<string, unknown>>(RESPONSES_URL),
  ]);

  const allBlocks = parseBlocks(blockRows);
  const blocks = allBlocks.filter((b) => !VOTE_REMAP_BY_KEY.has(b.key));
  const blockByKey = new Map<string, Block>();
  for (const b of blocks) blockByKey.set(b.key, b);

  const responses = parseResponses(responseRows);

  const votes: Vote[] = [];
  const unmatched: string[] = [];
  for (const r of responses) {
    // pre-canonicalize the vote name through VOTE_REMAP_BY_KEY first so e.g.
    // "Yellow Wall Banner" votes are credited to "Yellow Banner"
    const rawKey = blockKey(r.rawBlock);
    const key = VOTE_REMAP_BY_KEY.get(rawKey) ?? rawKey;
    const block = blockByKey.get(key);
    if (!block) {
      unmatched.push(r.rawBlock);
      continue;
    }
    votes.push({ timestamp: r.timestamp, block });
  }
  votes.sort((a, b) => a.timestamp - b.timestamp);

  if (unmatched.length) {
    const uniq = Array.from(new Set(unmatched));
    console.warn(
      `${unmatched.length} response(s) didn't match any block in blocks.csv. ` +
        `Distinct unmatched names: ${uniq.slice(0, 20).join(", ")}` +
        (uniq.length > 20 ? `, +${uniq.length - 20} more` : ""),
    );
  }

  const startTime = votes.length ? votes[0].timestamp : Date.now();
  const endTime = votes.length ? votes[votes.length - 1].timestamp : Date.now();

  // stamp blocks with .groupKey/.groupName and build the lookup maps used
  // by the GROUP toggle. runs once at boot; throws if any block ends up
  // double-claimed by two rules (see blockGroups.ts)
  const groupClassifier = buildGroupClassifier(blocks);

  return {
    blocks,
    blockByKey,
    votes,
    startTime,
    endTime,
    unmatched,
    groupClassifier,
  };
}
