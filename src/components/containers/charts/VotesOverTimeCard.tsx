import type { Vote } from "../../../data/types";
import { EVENTS } from "../../../data/events";
import { useTimeStore } from "../../../state/timeStore";
import { useVotesUpTo } from "../../../state/useVotesUpTo";
import { TimeSeriesArea } from "../../ui/charts/TimeSeriesArea";

interface Props {
  allVotes: Vote[];
  sampleCount?: number;
  windowFraction?: number;
}

export function VotesOverTimeCard({
  allVotes,
  sampleCount,
  windowFraction,
}: Props) {
  const slice = useVotesUpTo(allVotes);
  const startTime = useTimeStore((s) => s.startTime);
  const endTime = useTimeStore((s) => s.endTime);
  const currentTime = useTimeStore((s) => s.currentTime);

  return (
    <TimeSeriesArea
      events={slice.votes}
      startTime={startTime}
      endTime={endTime}
      currentTime={currentTime}
      title="votes over time"
      seriesLabel="votes"
      annotations={EVENTS}
      sampleCount={sampleCount}
      windowFraction={windowFraction}
    />
  );
}
