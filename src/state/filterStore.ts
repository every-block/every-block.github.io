import { create } from "zustand";

export interface FilterState {
  excludedVersions: Set<string>;

  toggleVersion: (version: string) => void;
  setExcluded: (next: Set<string>) => void;
  setMany: (versions: readonly string[], included: boolean) => void;
  selectAll: () => void;
  excludeAll: (allVersions: readonly string[]) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  excludedVersions: new Set<string>(),

  toggleVersion: (version) =>
    set((s) => {
      const next = new Set(s.excludedVersions);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return { excludedVersions: next };
    }),

  setExcluded: (next) => set({ excludedVersions: new Set(next) }),

  setMany: (versions, included) =>
    set((s) => {
      const next = new Set(s.excludedVersions);
      for (const v of versions) {
        if (included) next.delete(v);
        else next.add(v);
      }
      return { excludedVersions: next };
    }),

  selectAll: () => set({ excludedVersions: new Set<string>() }),

  excludeAll: (allVersions) =>
    set({ excludedVersions: new Set<string>(allVersions) }),
}));
