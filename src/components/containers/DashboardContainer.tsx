import { useEffect, useMemo, useState } from "react";
import { loadData, preloadImages } from "@/data/load-data";
import { loadBuildInfo, type BuildInfo } from "@/data/load-build-info";
import type { Block, DataBundle, Vote } from "@/types/domain";
import { useTimeStore } from "@/stores/time-store";
import { useVotesUpTo } from "@/hooks/use-votes-up-to";
import { usePlaybackLoop } from "@/hooks/use-playback-loop";
import { useFilterStore } from "@/stores/filter-store";
import { cleanVersion } from "@/utils/version-epoch";
import { EVENTS } from "@/data/events";
import { Dashboard } from "@/pages/Dashboard";

const EMPTY_VOTES: Vote[] = [];
const EMPTY_BLOCKS: Block[] = [];

export function DashboardContainer() {
  const [bundle, setBundle] = useState<DataBundle | null>(null);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const setRange = useTimeStore((s) => s.setRange);
  const setCurrentTime = useTimeStore((s) => s.setCurrentTime);
  const excludedVersions = useFilterStore((s) => s.excludedVersions);
  const excludedBlockKeys = useFilterStore((s) => s.excludedBlockKeys);

  usePlaybackLoop();

  useEffect(() => {
    let cancelled = false;
    loadData()
      .then((b) => {
        if (cancelled) return;
        setBundle(b);
        setRange(b.startTime, b.endTime);
        const def = EVENTS.find(
          (e) =>
            e.default === true &&
            e.timestamp >= b.startTime &&
            e.timestamp <= b.endTime,
        );
        if (def) setCurrentTime(def.timestamp);
        preloadImages(b.blocks, () => {
          setImageVersion((v) => v + 1);
        });
      })
      .catch((e: unknown) => {
        console.error(e);
        setError(e instanceof Error ? e.message : String(e));
      });
    loadBuildInfo().then((info) => {
      if (!cancelled) setBuildInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, [setRange, setCurrentTime]);

  const filteredVotes = useMemo<Vote[]>(() => {
    if (!bundle) return EMPTY_VOTES;
    if (excludedVersions.size === 0 && excludedBlockKeys.size === 0)
      return bundle.votes;
    return bundle.votes.filter(
      (v) =>
        !excludedVersions.has(cleanVersion(v.block.version)) &&
        !excludedBlockKeys.has(v.block.key),
    );
  }, [bundle, excludedVersions, excludedBlockKeys]);

  const filteredBlocks = useMemo<Block[]>(() => {
    if (!bundle) return EMPTY_BLOCKS;
    if (excludedVersions.size === 0 && excludedBlockKeys.size === 0)
      return bundle.blocks;
    return bundle.blocks.filter(
      (b) =>
        !excludedVersions.has(cleanVersion(b.version)) &&
        !excludedBlockKeys.has(b.key),
    );
  }, [bundle, excludedVersions, excludedBlockKeys]);

  const voteSlice = useVotesUpTo(filteredVotes);

  return (
    <Dashboard
      error={error}
      bundle={bundle}
      buildInfo={buildInfo}
      filteredVotes={filteredVotes}
      filteredBlocks={filteredBlocks}
      imageVersion={imageVersion}
      voteSliceCount={voteSlice.count}
    />
  );
}
