import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface MultiSelectOption {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  searchText?: string;
}

export interface MultiSelectGroup {
  key: string;
  label: ReactNode;
  searchText?: string;
  options: MultiSelectOption[];
}

interface Props {
  groups: MultiSelectGroup[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onSetGroup: (values: string[], selected: boolean) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  renderButtonLabel: (info: {
    selectedCount: number;
    totalCount: number;
  }) => ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  flattenSingletons?: boolean;
  emptyLabel?: string;
  className?: string;
}

type GroupState = "all" | "some" | "none";

export function MultiSelectFilter({
  groups,
  selected,
  onToggle,
  onSetGroup,
  onSelectAll,
  onClearAll,
  renderButtonLabel,
  searchable = false,
  searchPlaceholder = "Search…",
  flattenSingletons = true,
  emptyLabel = "No matches",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const totalCount = useMemo(
    () => groups.reduce((n, g) => n + g.options.length, 0),
    [groups],
  );
  const selectedCount = useMemo(() => {
    let n = 0;
    for (const g of groups) {
      for (const o of g.options) if (selected.has(o.value)) n++;
    }
    return n;
  }, [groups, selected]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return groups;
    const out: MultiSelectGroup[] = [];
    for (const g of groups) {
      const groupText = (g.searchText ?? textOf(g.label)).toLowerCase();
      const groupMatches = groupText.includes(normalizedQuery);
      const matched = groupMatches
        ? g.options
        : g.options.filter((o) =>
            (o.searchText ?? textOf(o.label))
              .toLowerCase()
              .includes(normalizedQuery),
          );
      if (matched.length > 0) out.push({ ...g, options: matched });
    }
    return out;
  }, [groups, normalizedQuery]);

  // When searching, auto-expand any group that has matches so hits are visible.
  const isGroupExpanded = (key: string) =>
    normalizedQuery ? true : openGroups.has(key);

  function groupState(values: string[]): GroupState {
    let on = 0;
    for (const v of values) if (selected.has(v)) on++;
    if (on === 0) return "none";
    if (on === values.length) return "all";
    return "some";
  }

  function toggleGroupOpen(key: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div
      className={`ui-multiselect${className ? ` ${className}` : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        className={`ui-multiselect-button${open ? " is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span>{renderButtonLabel({ selectedCount, totalCount })}</span>
        <span className="ui-multiselect-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="ui-multiselect-panel" role="dialog">
          {searchable && (
            <div className="ui-multiselect-search">
              <input
                type="search"
                className="ui-multiselect-search-input"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="ui-multiselect-toolbar">
            <button
              type="button"
              className="ui-multiselect-link"
              onClick={onSelectAll}
              disabled={selectedCount === totalCount}
            >
              Select all
            </button>
            <span className="ui-multiselect-sep">·</span>
            <button
              type="button"
              className="ui-multiselect-link"
              onClick={onClearAll}
              disabled={selectedCount === 0}
            >
              Clear all
            </button>
          </div>

          <div className="ui-multiselect-list">
            {filteredGroups.length === 0 && (
              <div className="ui-multiselect-empty">{emptyLabel}</div>
            )}
            {filteredGroups.map((g) => {
              if (flattenSingletons && g.options.length === 1) {
                const o = g.options[0];
                return (
                  <div className="ui-multiselect-group is-flat" key={g.key}>
                    <label className="ui-multiselect-flat-row">
                      <input
                        type="checkbox"
                        className="ui-multiselect-checkbox"
                        checked={selected.has(o.value)}
                        onChange={() => onToggle(o.value)}
                      />
                      {o.icon !== undefined && (
                        <span className="ui-multiselect-option-icon" aria-hidden>
                          {o.icon}
                        </span>
                      )}
                      <span className="ui-multiselect-option-label">
                        {o.label}
                      </span>
                    </label>
                  </div>
                );
              }

              const values = g.options.map((o) => o.value);
              const state = groupState(values);
              const expanded = isGroupExpanded(g.key);
              return (
                <div className="ui-multiselect-group" key={g.key}>
                  <div className="ui-multiselect-group-header">
                    <TriStateCheckbox
                      state={state}
                      onChange={(next) => onSetGroup(values, next === "all")}
                      ariaLabel={`Toggle all options in group`}
                    />
                    <button
                      type="button"
                      className="ui-multiselect-group-toggle"
                      onClick={() => toggleGroupOpen(g.key)}
                      aria-expanded={expanded}
                    >
                      <span className="ui-multiselect-group-name">
                        {g.label}
                      </span>
                      <span className="ui-multiselect-group-count">
                        {g.options.length}
                      </span>
                      <span
                        className={`ui-multiselect-group-chevron${
                          expanded ? " is-open" : ""
                        }`}
                        aria-hidden
                      >
                        ▸
                      </span>
                    </button>
                  </div>
                  {expanded && (
                    <ul className="ui-multiselect-group-list">
                      {g.options.map((o) => (
                        <li key={o.value}>
                          <label className="ui-multiselect-row">
                            <input
                              type="checkbox"
                              checked={selected.has(o.value)}
                              onChange={() => onToggle(o.value)}
                            />
                            {o.icon !== undefined && (
                              <span
                                className="ui-multiselect-option-icon"
                                aria-hidden
                              >
                                {o.icon}
                              </span>
                            )}
                            <span className="ui-multiselect-option-label">
                              {o.label}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function textOf(node: ReactNode): string {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  return "";
}

interface TriProps {
  state: GroupState;
  onChange: (next: GroupState) => void;
  ariaLabel?: string;
}

function TriStateCheckbox({ state, onChange, ariaLabel }: TriProps) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="ui-multiselect-checkbox"
      checked={state === "all"}
      onChange={() => onChange(state === "all" ? "none" : "all")}
      aria-label={ariaLabel}
    />
  );
}
