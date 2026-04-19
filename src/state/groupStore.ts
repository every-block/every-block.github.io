import { create } from "zustand";

export interface GroupState {
  group: boolean;
  toggle: () => void;
  set: (next: boolean) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  group: false,
  toggle: () => set((s) => ({ group: !s.group })),
  set: (next) => set({ group: next }),
}));
