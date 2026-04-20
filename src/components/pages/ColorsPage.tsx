import type { Block, Vote } from "../../data/types";
import { HueRingCard } from "../containers/charts/HueRingCard";
import { RgbCubeCard } from "../containers/charts/RgbCubeCard";

interface Props {
  votes: Vote[];
  blocks: Block[];
  imageVersion: number;
  groupRepBlockByKey: Map<string, Block | null>;
}

export function ColorsPage({
  votes,
  blocks,
  imageVersion,
  groupRepBlockByKey,
}: Props) {
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
