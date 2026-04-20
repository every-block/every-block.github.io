import { create } from "zustand";

export interface FilterState {
  excludedVersions: Set<string>;
  toggleVersion: (version: string) => void;
  setVersionsIncluded: (versions: readonly string[], included: boolean) => void;
  selectAllVersions: () => void;
  excludeAllVersions: (all: readonly string[]) => void;

  excludedBlockKeys: Set<string>;
  toggleBlockKey: (key: string) => void;
  setBlockKeysIncluded: (keys: readonly string[], included: boolean) => void;
  selectAllBlocks: () => void;
  excludeAllBlocks: (all: readonly string[]) => void;
}

const toggleIn = (current: Set<string>, value: string): Set<string> => {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

const setManyIn = (
  current: Set<string>,
  values: readonly string[],
  included: boolean,
): Set<string> => {
  const next = new Set(current);
  for (const v of values) {
    if (included) next.delete(v);
    else next.add(v);
  }
  return next;
};

export const useFilterStore = create<FilterState>((set) => ({
  excludedVersions: new Set<string>(),
  toggleVersion: (v) =>
    set((s) => ({ excludedVersions: toggleIn(s.excludedVersions, v) })),
  setVersionsIncluded: (versions, included) =>
    set((s) => ({
      excludedVersions: setManyIn(s.excludedVersions, versions, included),
    })),
  selectAllVersions: () => set({ excludedVersions: new Set<string>() }),
  excludeAllVersions: (all) => set({ excludedVersions: new Set<string>(all) }),

  excludedBlockKeys: new Set<string>(),
  toggleBlockKey: (k) =>
    set((s) => ({ excludedBlockKeys: toggleIn(s.excludedBlockKeys, k) })),
  setBlockKeysIncluded: (keys, included) =>
    set((s) => ({
      excludedBlockKeys: setManyIn(s.excludedBlockKeys, keys, included),
    })),
  selectAllBlocks: () => set({ excludedBlockKeys: new Set<string>() }),
  excludeAllBlocks: (all) =>
    set({ excludedBlockKeys: new Set<string>(all) }),
}));
