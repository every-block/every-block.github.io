import { useEffect, useMemo, useRef, useState } from "react";
import type { Block } from "@/types/domain";
import { useFilterStore } from "@/stores/filter-store";
import { allVersionsInOrder, groupVersions } from "@/utils/version-epoch";

interface Props {
  blocks: Block[];
}

type EpochState = "all" | "some" | "none";

export function VersionFilter({ blocks }: Props) {
  const groups = useMemo(() => groupVersions(blocks), [blocks]);
  const allVersions = useMemo(() => allVersionsInOrder(blocks), [blocks]);
  const totalVersions = allVersions.length;

  const excluded = useFilterStore((s) => s.excludedVersions);
  const toggleVersion = useFilterStore((s) => s.toggleVersion);
  const setMany = useFilterStore((s) => s.setMany);
  const selectAll = useFilterStore((s) => s.selectAll);
  const excludeAll = useFilterStore((s) => s.excludeAll);

  const includedCount = totalVersions - excluded.size;

  const [open, setOpen] = useState(false);
  const [openEpochs, setOpenEpochs] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement | null>(null);
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

  const buttonLabel =
    excluded.size === 0
      ? `All versions (${totalVersions})`
      : includedCount === 0
        ? "No versions"
        : `${includedCount} of ${totalVersions} versions`;

  function epochState(versions: string[]): EpochState {
    let on = 0;
    for (const v of versions) if (!excluded.has(v)) on++;
    if (on === 0) return "none";
    if (on === versions.length) return "all";
    return "some";
  }

  function toggleEpochOpen(epoch: string) {
    setOpenEpochs((prev) => {
      const next = new Set(prev);
      if (next.has(epoch)) next.delete(epoch);
      else next.add(epoch);
      return next;
    });
  }

  function setEpoch(versions: string[], included: boolean) {
    setMany(versions, included);
  }

  return (
    <div className="version-filter" ref={containerRef}>
      <button
        type="button"
        className={`version-filter-button${open ? " is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span>{buttonLabel}</span>
        <span className="version-filter-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="version-filter-panel" role="dialog">
          <div className="version-filter-panel-toolbar">
            <button
              type="button"
              className="version-filter-link"
              onClick={() => selectAll()}
              disabled={excluded.size === 0}
            >
              Select all
            </button>
            <span className="version-filter-sep">·</span>
            <button
              type="button"
              className="version-filter-link"
              onClick={() => excludeAll(allVersions)}
              disabled={includedCount === 0}
            >
              Clear all
            </button>
          </div>

          <div className="version-filter-panel-list">
            {groups.map((g) => {
              if (g.versions.length === 1) {
                const v = g.versions[0];
                const label = v === g.epoch ? v : `${g.epoch} · ${v}`;
                return (
                  <div className="version-epoch is-flat" key={g.epoch}>
                    <label className="version-epoch-flat-row">
                      <input
                        type="checkbox"
                        className="version-epoch-checkbox"
                        checked={!excluded.has(v)}
                        onChange={() => toggleVersion(v)}
                      />
                      <span className="version-epoch-name">{label}</span>
                    </label>
                  </div>
                );
              }

              const state = epochState(g.versions);
              const expanded = openEpochs.has(g.epoch);
              return (
                <div className="version-epoch" key={g.epoch}>
                  <div className="version-epoch-header">
                    <TriStateCheckbox
                      state={state}
                      onChange={(next) =>
                        setEpoch(g.versions, next === "all")
                      }
                      ariaLabel={`Toggle all versions in ${g.epoch}`}
                    />
                    <button
                      type="button"
                      className="version-epoch-toggle"
                      onClick={() => toggleEpochOpen(g.epoch)}
                      aria-expanded={expanded}
                    >
                      <span className="version-epoch-name">{g.epoch}</span>
                      <span className="version-epoch-count">
                        {g.versions.length}
                      </span>
                      <span
                        className={`version-epoch-chevron${
                          expanded ? " is-open" : ""
                        }`}
                        aria-hidden
                      >
                        ▸
                      </span>
                    </button>
                  </div>
                  {expanded && (
                    <ul className="version-epoch-list">
                      {g.versions.map((v) => (
                        <li key={v}>
                          <label className="version-row">
                            <input
                              type="checkbox"
                              checked={!excluded.has(v)}
                              onChange={() => toggleVersion(v)}
                            />
                            <span>{v}</span>
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

interface TriProps {
  state: EpochState;
  onChange: (next: EpochState) => void;
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
      className="version-epoch-checkbox"
      checked={state === "all"}
      onChange={() => {
        onChange(state === "all" ? "none" : "all");
      }}
      aria-label={ariaLabel}
    />
  );
}
