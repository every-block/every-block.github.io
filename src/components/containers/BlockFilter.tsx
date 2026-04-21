import { useMemo } from "react";
import type { Block } from "@/types/domain";
import { useFilterStore } from "@/stores/filter-store";
import {
  MultiSelectFilter,
  type MultiSelectGroup,
  type MultiSelectVariant,
} from "@/ui/MultiSelectFilter";
import { ItemSprite } from "@/ui/ItemSprite";

interface Props {
  blocks: Block[];
  variant?: MultiSelectVariant;
}

export function BlockFilter({ blocks, variant }: Props) {
  const excluded = useFilterStore((s) => s.excludedBlockKeys);
  const toggleBlockKey = useFilterStore((s) => s.toggleBlockKey);
  const setBlockKeysIncluded = useFilterStore((s) => s.setBlockKeysIncluded);
  const selectAllBlocks = useFilterStore((s) => s.selectAllBlocks);
  const excludeAllBlocks = useFilterStore((s) => s.excludeAllBlocks);

  const allKeys = useMemo(() => blocks.map((b) => b.key), [blocks]);

  const groups = useMemo<MultiSelectGroup[]>(() => {
    const groupsMap = new Map<
      string,
      { key: string; name: string; members: Block[] }
    >();
    const ungrouped: Block[] = [];
    for (const b of blocks) {
      if (b.groupKey && b.groupName) {
        const g = groupsMap.get(b.groupKey);
        if (g) g.members.push(b);
        else
          groupsMap.set(b.groupKey, {
            key: b.groupKey,
            name: b.groupName,
            members: [b],
          });
      } else {
        ungrouped.push(b);
      }
    }

    const grouped: MultiSelectGroup[] = Array.from(groupsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((g) => ({
        key: g.key,
        label: g.name,
        searchText: g.name,
        options: g.members
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((b) => ({
            value: b.key,
            label: b.name,
            icon: <ItemSprite block={b} />,
            searchText: `${g.name} ${b.name}`,
          })),
      }));

    const loose: MultiSelectGroup[] = ungrouped
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((b) => ({
        key: b.key,
        label: b.name,
        options: [
          {
            value: b.key,
            label: b.name,
            icon: <ItemSprite block={b} />,
            searchText: b.name,
          },
        ],
      }));

    return [...grouped, ...loose];
  }, [blocks]);

  const selected = useMemo(() => {
    const s = new Set<string>();
    for (const b of blocks) if (!excluded.has(b.key)) s.add(b.key);
    return s;
  }, [blocks, excluded]);

  return (
    <MultiSelectFilter
      groups={groups}
      selected={selected}
      onToggle={toggleBlockKey}
      onSetGroup={(values, included) => setBlockKeysIncluded(values, included)}
      onSelectAll={selectAllBlocks}
      onClearAll={() => excludeAllBlocks(allKeys)}
      searchable
      searchPlaceholder="Search blocks…"
      variant={variant}
      renderButtonLabel={({ selectedCount, totalCount }) => {
        if (selectedCount === totalCount) return `All blocks (${totalCount})`;
        if (selectedCount === 0) return "No blocks";
        return `${selectedCount} of ${totalCount} blocks`;
      }}
    />
  );
}
