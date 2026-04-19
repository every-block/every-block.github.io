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
    <div className="tab-switcher" role="tablist" aria-label="Sections">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab-switcher-button${isActive ? " is-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
