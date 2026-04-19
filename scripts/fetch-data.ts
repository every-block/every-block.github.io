import { mkdir, writeFile } from "node:fs/promises";

interface SheetSpec {
  name: string;
  id: string | undefined;
  gid: string | undefined;
}

const SHEETS: readonly SheetSpec[] = [
  {
    name: "blocks.csv",
    id: process.env.BLOCKS_SHEET_ID,
    gid: process.env.BLOCKS_SHEET_GID,
  },
  {
    name: "responses.csv",
    id: process.env.RESPONSES_SHEET_ID,
    gid: process.env.RESPONSES_SHEET_GID,
  },
];

const OUT_DIR = "public/data";

await mkdir(OUT_DIR, { recursive: true });

for (const { name, id, gid } of SHEETS) {
  if (!id || !gid) {
    throw new Error(
      `missing env vars for ${name}: set ${envVarsFor(name).join(" and ")}`,
    );
  }
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Fetch ${name} failed: ${res.status} ${res.statusText} (${url})`,
    );
  }
  const text = await res.text();
  if (text.startsWith("<!DOCTYPE html") || text.startsWith("<html")) {
    throw new Error(
      `fetch ${name} returned HTML instead of CSV, is the sheet publicly readable?`,
    );
  }
  const outPath = `${OUT_DIR}/${name}`;
  await writeFile(outPath, text);
  console.log(`fetched ${name} -> ${outPath} (${text.length} bytes)`);
}

const buildInfo = { fetchedAt: new Date().toISOString() };
await writeFile(
  `${OUT_DIR}/build-info.json`,
  JSON.stringify(buildInfo, null, 2),
);
console.log(`stamped build-info.json (${buildInfo.fetchedAt})`);

function envVarsFor(name: string): string[] {
  const prefix = name === "blocks.csv" ? "BLOCKS" : "RESPONSES";
  return [`${prefix}_SHEET_ID`, `${prefix}_SHEET_GID`];
}
