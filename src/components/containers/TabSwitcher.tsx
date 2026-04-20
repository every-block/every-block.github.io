import { Tabs } from "@/ui/Tabs";

export type TabId = "stats" | "colors" | "logistics";

export const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: "stats", label: "STATS" },
  { id: "colors", label: "COLORS" },
  { id: "logistics", label: "LOGISTICS" },
];

interface Props {
  active: TabId;
  onChange: (next: TabId) => void;
}

export function TabSwitcher({ active, onChange }: Props) {
  return (
    <Tabs<TabId>
      items={TABS}
      active={active}
      onChange={onChange}
      size="md"
      ariaLabel="Sections"
    />
  );
}
