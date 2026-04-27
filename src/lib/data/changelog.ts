export interface ChangelogEntry {
  at: string;
  items: readonly string[];
}

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    at: "2026-04-26",
    items: [
      "Mapped **Torchflower Crop** to **Torchflower**",
      "Mapped **Potted Torchflower** to **Torchflower**",
      "Mapped **Pitcher Crop** to **Pitcher Plant**",
    ],
  },
];
