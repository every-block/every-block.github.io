import { Tabs } from "@/ui/Tabs";

export type TabId = "stats" | "colors" | "logistics";

export const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: "stats", label: "STATS" },
  { id: "colors", label: "COLORS" },
  { id: "logistics", label: "LOGISTICS" },
];

const ITEMS = TABS.map((t) => ({
  ...t,
  buttonProps: {
    "data-umami-event": "app_section",
    "data-umami-event-section": t.id,
  },
}));

interface Props {
  active: TabId;
  onChange: (next: TabId) => void;
}

export function TabSwitcher({ active, onChange }: Props) {
  return (
    <Tabs<TabId>
      items={ITEMS}
      active={active}
      onChange={onChange}
      size="md"
      ariaLabel="Sections"
    />
  );
}
