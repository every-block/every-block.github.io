import { create } from "zustand";

export interface NormalizeState {
  normalize: boolean;
  toggle: () => void;
  set: (next: boolean) => void;
}

export const useNormalizeStore = create<NormalizeState>((set) => ({
  normalize: false,
  toggle: () => set((s) => ({ normalize: !s.normalize })),
  set: (next) => set({ normalize: next }),
}));
