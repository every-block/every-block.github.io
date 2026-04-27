import type { Block } from "@/types/domain";
import { BottomSheet } from "@/ui/BottomSheet";
import { NormalizeToggle } from "@/containers/NormalizeToggle";
import { GroupToggle } from "@/containers/GroupToggle";
import { BlockFilter } from "@/containers/BlockFilter";
import { VersionFilter } from "@/containers/VersionFilter";

interface Props {
  open: boolean;
  onClose: () => void;
  blocks: Block[] | null;
}

export function MobileFiltersSheet({ open, onClose, blocks }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Filters & view">
      <div className="mobile-filters-group">
        <div className="mobile-filters-row mobile-filters-row--toggles">
          <NormalizeToggle />
          <GroupToggle />
        </div>
      </div>
      {blocks && (
        <>
          <div className="mobile-filters-group">
            <div className="mobile-filters-label">Blocks</div>
            <BlockFilter blocks={blocks} variant="inline" />
          </div>
          <div className="mobile-filters-group">
            <div className="mobile-filters-label">Versions</div>
            <VersionFilter blocks={blocks} variant="inline" />
          </div>
        </>
      )}
    </BottomSheet>
  );
}
