import { mkdir, stat, writeFile } from "node:fs/promises";

interface SheetSpec {
  name: string;
  id: string | undefined;
  gid: string | undefined;
  fallback: boolean;
}

const SHEETS: readonly SheetSpec[] = [
  {
    name: "blocks.csv",
    id: process.env.BLOCKS_SHEET_ID,
    gid: process.env.BLOCKS_SHEET_GID,
    fallback: true,
  },
  {
    name: "responses.csv",
    id: process.env.RESPONSES_SHEET_ID,
    gid: process.env.RESPONSES_SHEET_GID,
    fallback: false,
  },
];

const OUT_DIR = "public/data";

await mkdir(OUT_DIR, { recursive: true });

for (const sheet of SHEETS) {
  await fetchSheet(sheet);
}

const buildInfo = { fetchedAt: new Date().toISOString() };
await writeFile(
  `${OUT_DIR}/build-info.json`,
  JSON.stringify(buildInfo, null, 2),
);
console.log(`stamped build-info.json (${buildInfo.fetchedAt})`);

async function fetchSheet(sheet: SheetSpec): Promise<void> {
  const { name, id, gid, fallback } = sheet;
  const outPath = `${OUT_DIR}/${name}`;

  try {
    if (!id || !gid) {
      throw new Error(
        `missing env vars for ${name}: set ${envVarsFor(name).join(" and ")}`,
      );
    }
    const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `fetch ${name} failed: ${res.status} ${res.statusText} (${url})`,
      );
    }
    const text = await res.text();
    if (text.startsWith("<!DOCTYPE html") || text.startsWith("<html")) {
      throw new Error(
        `fetch ${name} returned HTML instead of CSV, is the sheet publicly readable?`,
      );
    }
    await writeFile(outPath, text);
    console.log(`fetched ${name} -> ${outPath} (${text.length} bytes)`);
  } catch (err) {
    if (!fallback) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    const existing = await fileExists(outPath);
    if (existing) {
      console.warn(
        `[warn] ${msg}\n[warn] using existing committed ${outPath} as fallback`,
      );
    } else {
      throw new Error(
        `${msg}\nno fallback found at ${outPath} either; aborting`,
      );
    }
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function envVarsFor(name: string): string[] {
  const prefix = name === "blocks.csv" ? "BLOCKS" : "RESPONSES";
  return [`${prefix}_SHEET_ID`, `${prefix}_SHEET_GID`];
}
