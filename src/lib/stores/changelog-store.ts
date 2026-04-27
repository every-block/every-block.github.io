import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChangelogState {
  introDismissed: boolean;
  open: boolean;
  openChangelog: () => void;
  closeChangelog: () => void;
}

type PersistedSlice = Pick<ChangelogState, "introDismissed">;

export const useChangelogStore = create<ChangelogState>()(
  persist(
    (set) => ({
      introDismissed: false,
      open: true,
      openChangelog: () => set({ open: true }),
      closeChangelog: () => set({ open: false, introDismissed: true }),
    }),
    {
      name: "every-block-changelog",
      partialize: (s): PersistedSlice => ({ introDismissed: s.introDismissed }),
      merge: (persistedState, currentState) => {
        const p = (persistedState as Partial<PersistedSlice> | undefined) ?? {};
        const introDismissed = p.introDismissed ?? false;
        return {
          ...currentState,
          introDismissed,
          open: !introDismissed,
        };
      },
    },
  ),
);
