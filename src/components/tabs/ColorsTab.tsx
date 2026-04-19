import type { Block, Vote } from "../../data/types";
import { HueRingKde } from "../charts/HueRingKde";
import { RgbCubeCanvas } from "../charts/RgbCubeCanvas";

interface Props {
  votes: Vote[];
  blocks: Block[];
  imageVersion: number;
  groupRepBlockByKey: Map<string, Block | null>;
}

export function ColorsTab({
  votes,
  blocks,
  imageVersion,
  groupRepBlockByKey,
}: Props) {
  return (
    <div className="tab-grid tab-grid-colors">
      <HueRingKde allVotes={votes} blocks={blocks} />
      <RgbCubeCanvas
        allVotes={votes}
        imageVersion={imageVersion}
        groupRepBlockByKey={groupRepBlockByKey}
      />
    </div>
  );
}
