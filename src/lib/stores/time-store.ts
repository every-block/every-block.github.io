import { create } from "zustand";

export type Speed = 0.1 | 0.25 | 0.5 | 1 | 2 | 4 | 10 | 50;

export const SPEED_OPTIONS: readonly Speed[] = [0.1, 0.25, 0.5, 1, 2, 4, 10, 50];

export const BASE_PLAYTHROUGH_MS = 60_000;

export interface TimeState {
  startTime: number;
  endTime: number;
  currentTime: number;
  isPlaying: boolean;
  speed: Speed;

  setRange: (startTime: number, endTime: number) => void;
  setCurrentTime: (t: number) => void;
  setSpeed: (s: Speed) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export const useTimeStore = create<TimeState>((set) => ({
  startTime: 0,
  endTime: 0,
  currentTime: 0,
  isPlaying: false,
  speed: 1,

  setRange: (startTime, endTime) =>
    set(() => ({
      startTime,
      endTime,
      currentTime: startTime,
      isPlaying: false,
    })),

  setCurrentTime: (t) =>
    set((s) => ({ currentTime: clamp(t, s.startTime, s.endTime) })),

  setSpeed: (speed) => set({ speed }),

  play: () =>
    set((s) => {
      if (s.currentTime >= s.endTime) {
        return { isPlaying: true, currentTime: s.startTime };
      }
      return { isPlaying: true };
    }),

  pause: () => set({ isPlaying: false }),

  toggle: () =>
    set((s) => {
      if (s.isPlaying) return { isPlaying: false };
      if (s.currentTime >= s.endTime) {
        return { isPlaying: true, currentTime: s.startTime };
      }
      return { isPlaying: true };
    }),

  restart: () => set((s) => ({ currentTime: s.startTime, isPlaying: false })),
}));
