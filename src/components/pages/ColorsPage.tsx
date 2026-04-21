import { useState } from "react";
import type { Block, Vote } from "@/types/domain";
import { HueRingCard } from "@/containers/charts/HueRingCard";
import { RgbCubeCard } from "@/containers/charts/RgbCubeCard";
import { Tabs } from "@/ui/Tabs";

interface Props {
  votes: Vote[];
  blocks: Block[];
  imageVersion: number;
  groupRepBlockByKey: Map<string, Block | null>;
  isNarrow?: boolean;
}

type ColorsChartId = "hue" | "cube";

const COLORS_CHART_TABS: ReadonlyArray<{ id: ColorsChartId; label: string }> = [
  { id: "hue", label: "HUE RING" },
  { id: "cube", label: "RGB CUBE" },
];

export function ColorsPage({
  votes,
  blocks,
  imageVersion,
  groupRepBlockByKey,
  isNarrow,
}: Props) {
  const [mobileChart, setMobileChart] = useState<ColorsChartId>("hue");

  if (!isNarrow) {
    return (
      <div className="tab-grid tab-grid-colors">
        <HueRingCard allVotes={votes} blocks={blocks} />
        <RgbCubeCard
          allVotes={votes}
          imageVersion={imageVersion}
          groupRepBlockByKey={groupRepBlockByKey}
        />
      </div>
    );
  }

  return (
    <div className="tab-grid tab-grid--mobile">
      <div className="mobile-chart-picker">
        <Tabs<ColorsChartId>
          size="sm"
          items={COLORS_CHART_TABS}
          active={mobileChart}
          onChange={setMobileChart}
          ariaLabel="Colors chart"
        />
      </div>
      <div className="mobile-chart-slot">
        {mobileChart === "hue" ? (
          <HueRingCard allVotes={votes} blocks={blocks} />
        ) : (
          <RgbCubeCard
            allVotes={votes}
            imageVersion={imageVersion}
            groupRepBlockByKey={groupRepBlockByKey}
          />
        )}
      </div>
    </div>
  );
}
