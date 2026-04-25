import { useState } from "react";
import type { Block, Vote } from "@/types/domain";
import { TopBlocksRace } from "@/containers/charts/TopBlocksRace";
import { TopVersionsRace } from "@/containers/charts/TopVersionsRace";
import { VersionHistogramCard } from "@/containers/charts/VersionHistogramCard";
import { Tabs } from "@/ui/Tabs";

interface Props {
  votes: Vote[];
  blocks: Block[];
  isNarrow?: boolean;
}

type StatsChartId = "blocks" | "versions" | "histogram";

const STATS_CHART_TABS: ReadonlyArray<{ id: StatsChartId; label: string }> = [
  { id: "blocks", label: "BLOCKS" },
  { id: "versions", label: "VERSIONS" },
  { id: "histogram", label: "HISTOGRAM" },
];

const STATS_CHART_TAB_ITEMS = STATS_CHART_TABS.map((t) => ({
  ...t,
  buttonProps: {
    "data-umami-event": "stats_chart",
    "data-umami-event-chart": t.id,
  },
}));

export function StatsPage({ votes, blocks, isNarrow }: Props) {
  const [mobileChart, setMobileChart] = useState<StatsChartId>("blocks");

  if (!isNarrow) {
    return (
      <div className="tab-grid tab-grid-stats">
        <TopBlocksRace allVotes={votes} blocks={blocks} />
        <TopVersionsRace allVotes={votes} blocks={blocks} />
        <VersionHistogramCard allVotes={votes} blocks={blocks} />
      </div>
    );
  }

  return (
    <div className="tab-grid tab-grid--mobile">
      <div className="mobile-chart-picker">
        <Tabs<StatsChartId>
          size="sm"
          items={STATS_CHART_TAB_ITEMS}
          active={mobileChart}
          onChange={setMobileChart}
          ariaLabel="Stats chart"
        />
      </div>
      <div className="mobile-chart-slot">
        {mobileChart === "blocks" ? (
          <TopBlocksRace allVotes={votes} blocks={blocks} />
        ) : mobileChart === "versions" ? (
          <TopVersionsRace allVotes={votes} blocks={blocks} />
        ) : (
          <VersionHistogramCard allVotes={votes} blocks={blocks} />
        )}
      </div>
    </div>
  );
}
