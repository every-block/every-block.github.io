import type { Block, Vote } from "@/types/domain";
import { TopBlocksRace } from "@/containers/charts/TopBlocksRace";
import { TopVersionsRace } from "@/containers/charts/TopVersionsRace";
import { VersionHistogramCard } from "@/containers/charts/VersionHistogramCard";

interface Props {
  votes: Vote[];
  blocks: Block[];
}

export function StatsPage({ votes, blocks }: Props) {
  return (
    <div className="tab-grid tab-grid-stats">
      <TopBlocksRace allVotes={votes} blocks={blocks} />
      <TopVersionsRace allVotes={votes} blocks={blocks} />
      <VersionHistogramCard allVotes={votes} blocks={blocks} />
    </div>
  );
}
