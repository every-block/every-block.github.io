import type { Vote } from "@/types/domain";
import { VotesOverTimeCard } from "@/containers/charts/VotesOverTimeCard";

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
