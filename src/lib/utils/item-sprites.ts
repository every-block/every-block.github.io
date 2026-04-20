export interface ItemSpriteEntry {
  path: string;
  frameHeight?: number;
}

export type ItemSpriteManifest = Map<string, ItemSpriteEntry>;

const MANIFEST_URL = "/data/item-sprites.json";

let cached: Promise<ItemSpriteManifest> | null = null;

export function loadItemSpriteManifest(): Promise<ItemSpriteManifest> {
  if (!cached) {
    cached = fetchManifest().catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}

async function fetchManifest(): Promise<ItemSpriteManifest> {
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) {
    throw new Error(`failed to fetch ${MANIFEST_URL}: ${res.status}`);
  }
  const json = (await res.json()) as Record<string, ItemSpriteEntry>;
  const map: ItemSpriteManifest = new Map();
  for (const [k, v] of Object.entries(json)) {
    if (v && typeof v.path === "string") map.set(k, v);
  }
  return map;
}

export function getItemSpriteEntry(
  id: string,
  manifest: ItemSpriteManifest,
): ItemSpriteEntry | null {
  if (!id) return null;
  return manifest.get(id) ?? null;
}

export function getItemSpriteUrl(
  id: string,
  manifest: ItemSpriteManifest,
): string | null {
  const entry = getItemSpriteEntry(id, manifest);
  return entry ? `/${entry.path}` : null;
}
