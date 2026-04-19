import { create } from "zustand";

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export interface SaturationState {
  minSaturation: number;
  setMinSaturation: (v: number) => void;
}

export const useSaturationStore = create<SaturationState>((set) => ({
  minSaturation: 0.15,
  setMinSaturation: (v) => set({ minSaturation: clamp(v, 0, 1) }),
}));
