import type { Vote } from "../../data/types";
import { VotesOverTime } from "../charts/VotesOverTime";

interface Props {
  votes: Vote[];
}

export function LogisticsTab({ votes }: Props) {
  return (
    <div className="tab-grid tab-grid-logistics">
      <VotesOverTime allVotes={votes} />
    </div>
  );
}
