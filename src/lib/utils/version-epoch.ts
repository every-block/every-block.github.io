import type { Block } from "@/types/domain";

const NAMED_EPOCH_ORDER = [
  "Pre-Classic",
  "Classic",
  "Indev/Infdev",
  "Alpha",
  "Beta",
] as const;

const OTHER_EPOCH = "Other";

export function cleanVersion(raw: string): string {
  return raw
    .replace(/\[[^\]]*\]/g, "") // drop "[note 5]" etc.
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.+$/, ""); // drop trailing dots ("1.20." -> "1.20")
}

export function epochOf(raw: string): string {
  const v = cleanVersion(raw);
  if (!v) return OTHER_EPOCH;
  const lc = v.toLowerCase();

  if (lc.startsWith("pre-classic") || lc.startsWith("pre classic")) {
    return "Pre-Classic";
  }
  if (lc.startsWith("classic")) return "Classic";
  if (lc === "dev" || lc.startsWith("indev") || lc.startsWith("infdev")) {
    return "Indev/Infdev";
  }
  if (lc.startsWith("alpha")) return "Alpha";
  if (lc.startsWith("beta")) return "Beta";

  // numeric "MAJOR.MINOR[...]" -> epoch is "MAJOR.MINOR".
  // Tolerates things like "1.20a" -> "1.20".
  const m = v.match(/^(\d+)\.(\d+)/);
  if (m) return `${m[1]}.${m[2]}`;

  return OTHER_EPOCH;
}

export function epochSortKey(epoch: string): number {
  const idx = NAMED_EPOCH_ORDER.indexOf(epoch as (typeof NAMED_EPOCH_ORDER)[number]);
  if (idx >= 0) return idx;
  if (epoch === OTHER_EPOCH) return Number.POSITIVE_INFINITY;
  const m = epoch.match(/^(\d+)\.(\d+)$/);
  if (m) return 1000 + Number(m[1]) * 1000 + Number(m[2]);
  return Number.POSITIVE_INFINITY - 1;
}

export function versionSortKey(raw: string): readonly (number | string)[] {
  const v = cleanVersion(raw);
  // split on dots; coerce numeric pieces to numbers, leave others as strings
  const parts = v.split(/\.|\s+/).filter(Boolean);
  return parts.map((p) => {
    const n = Number(p);
    return Number.isFinite(n) ? n : p.toLowerCase();
  });
}

function compareVersionKeys(
  a: readonly (number | string)[],
  b: readonly (number | string)[],
): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai === undefined) return -1;
    if (bi === undefined) return 1;
    if (typeof ai === "number" && typeof bi === "number") {
      if (ai !== bi) return ai - bi;
    } else {
      const as = String(ai);
      const bs = String(bi);
      if (as < bs) return -1;
      if (as > bs) return 1;
    }
  }
  return 0;
}

export interface EpochGroup {
  epoch: string;
  // versions under this epoch, in release order
  versions: string[];
}

export function groupVersions(blocks: Block[]): EpochGroup[] {
  const byEpoch = new Map<string, Set<string>>();
  for (const b of blocks) {
    const v = cleanVersion(b.version);
    if (!v) {
      const set = byEpoch.get(OTHER_EPOCH) ?? new Set<string>();
      set.add("(unknown)");
      byEpoch.set(OTHER_EPOCH, set);
      continue;
    }
    const ep = epochOf(b.version);
    const set = byEpoch.get(ep) ?? new Set<string>();
    set.add(v);
    byEpoch.set(ep, set);
  }

  const groups: EpochGroup[] = [];
  for (const [epoch, set] of byEpoch) {
    const versions = Array.from(set).sort((a, b) =>
      compareVersionKeys(versionSortKey(a), versionSortKey(b)),
    );
    groups.push({ epoch, versions });
  }
  groups.sort((a, b) => epochSortKey(a.epoch) - epochSortKey(b.epoch));
  return groups;
}

export function allVersionsInOrder(blocks: Block[]): string[] {
  const out: string[] = [];
  for (const g of groupVersions(blocks)) out.push(...g.versions);
  return out;
}
