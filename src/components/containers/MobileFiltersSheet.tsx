import type { Block } from "@/types/domain";
import type { BuildInfo } from "@/data/load-build-info";
import { BottomSheet } from "@/ui/BottomSheet";
import { LastRefreshedIndicator } from "@/containers/LastRefreshedIndicator";
import { NormalizeToggle } from "@/containers/NormalizeToggle";
import { GroupToggle } from "@/containers/GroupToggle";
import { BlockFilter } from "@/containers/BlockFilter";
import { VersionFilter } from "@/containers/VersionFilter";

interface Props {
  open: boolean;
  onClose: () => void;
  blocks: Block[] | null;
  buildInfo: BuildInfo | null;
}

export function MobileFiltersSheet({ open, onClose, blocks, buildInfo }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Filters & view">
      <div className="mobile-filters-group">
        <div className="mobile-filters-row mobile-filters-row--toggles">
          <NormalizeToggle />
          <GroupToggle />
          <LastRefreshedIndicator buildInfo={buildInfo} />
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
