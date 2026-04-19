import { useMemo } from "react";
import type { Vote } from "../data/types";
import { useTimeStore } from "./timeStore";

function upperBoundIndex(votes: Vote[], t: number): number {
  let lo = 0;
  let hi = votes.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (votes[mid].timestamp <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

export interface VoteSlice {
  votes: Vote[];
  count: number;
}

export function useVotesUpTo(allVotes: Vote[]): VoteSlice {
  const currentTime = useTimeStore((s) => s.currentTime);
  return useMemo(() => {
    const i = upperBoundIndex(allVotes, currentTime);
    const count = i + 1;
    return { votes: allVotes.slice(0, count), count };
  }, [allVotes, currentTime]);
}
