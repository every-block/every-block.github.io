import type { Block, Vote } from "../../data/types";
import { TopBlocksHBar } from "../charts/TopBlocksHBar";
import { TopVersionsHBar } from "../charts/TopVersionsHBar";
import { VersionHistogram } from "../charts/VersionHistogram";

interface Props {
  votes: Vote[];
  blocks: Block[];
}

export function StatsTab({ votes, blocks }: Props) {
  return (
    <div className="tab-grid tab-grid-stats">
      <TopBlocksHBar allVotes={votes} blocks={blocks} />
      <TopVersionsHBar allVotes={votes} blocks={blocks} />
      <VersionHistogram allVotes={votes} blocks={blocks} />
    </div>
  );
}
