import type { Vote } from "../../data/types";
import { VotesOverTimeCard } from "../containers/charts/VotesOverTimeCard";

interface Props {
  votes: Vote[];
}

export function LogisticsPage({ votes }: Props) {
  return (
    <div className="tab-grid tab-grid-logistics">
      <VotesOverTimeCard allVotes={votes} />
    </div>
  );
}
