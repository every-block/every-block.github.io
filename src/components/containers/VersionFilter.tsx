import { useMemo } from "react";
import type { Block } from "@/types/domain";
import { useFilterStore } from "@/stores/filter-store";
import { allVersionsInOrder, groupVersions } from "@/utils/version-epoch";
import {
  MultiSelectFilter,
  type MultiSelectGroup,
  type MultiSelectVariant,
} from "@/ui/MultiSelectFilter";

interface Props {
  blocks: Block[];
  variant?: MultiSelectVariant;
}

export function VersionFilter({ blocks, variant }: Props) {
  const epochs = useMemo(() => groupVersions(blocks), [blocks]);
  const allVersions = useMemo(() => allVersionsInOrder(blocks), [blocks]);

  const excluded = useFilterStore((s) => s.excludedVersions);
  const toggleVersion = useFilterStore((s) => s.toggleVersion);
  const setVersionsIncluded = useFilterStore((s) => s.setVersionsIncluded);
  const selectAllVersions = useFilterStore((s) => s.selectAllVersions);
  const excludeAllVersions = useFilterStore((s) => s.excludeAllVersions);

  const selected = useMemo(() => {
    const s = new Set<string>();
    for (const v of allVersions) if (!excluded.has(v)) s.add(v);
    return s;
  }, [allVersions, excluded]);

  const groups = useMemo<MultiSelectGroup[]>(
    () =>
      epochs.map((g) => ({
        key: g.epoch,
        label: g.epoch,
        options: g.versions.map((v) => ({
          value: v,
          label:
            g.versions.length === 1 && v !== g.epoch ? `${g.epoch} · ${v}` : v,
          searchText: `${g.epoch} ${v}`,
        })),
      })),
    [epochs],
  );

  return (
    <MultiSelectFilter
      groups={groups}
      selected={selected}
      onToggle={toggleVersion}
      onSetGroup={(values, included) => setVersionsIncluded(values, included)}
      onSelectAll={selectAllVersions}
      onClearAll={() => excludeAllVersions(allVersions)}
      searchable
      searchPlaceholder="Search versions…"
      variant={variant}
      renderButtonLabel={({ selectedCount, totalCount }) => {
        if (selectedCount === totalCount) return `All versions (${totalCount})`;
        if (selectedCount === 0) return "No versions";
        return `${selectedCount} of ${totalCount} versions`;
      }}
    />
  );
}
