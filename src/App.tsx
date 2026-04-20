import { useEffect, useMemo, useState } from "react";
import { loadData, preloadImages } from "@/data/load-data";
import { loadBuildInfo, type BuildInfo } from "@/data/load-build-info";
import type { Block, DataBundle, Vote } from "@/types/domain";
import { useTimeStore } from "@/stores/time-store";
import { useVotesUpTo } from "@/hooks/use-votes-up-to";
import { usePlaybackLoop } from "@/hooks/use-playback-loop";
import { useFilterStore } from "@/stores/filter-store";
import { TimeScrubber } from "@/containers/TimeScrubber";
import { VersionFilter } from "@/containers/VersionFilter";
import { NormalizeToggle } from "@/containers/NormalizeToggle";
import { GroupToggle } from "@/containers/GroupToggle";
import { LastRefreshedIndicator } from "@/containers/LastRefreshedIndicator";
import { TabSwitcher, type TabId } from "@/containers/TabSwitcher";
import { StatsPage } from "@/pages/StatsPage";
import { ColorsPage } from "@/pages/ColorsPage";
import { LogisticsPage } from "@/pages/LogisticsPage";
import { cleanVersion } from "@/utils/version-epoch";
import { EVENTS } from "@/data/events";
import { PYRO_QUOTES } from "@/data/quotes";

const EMPTY_VOTES: Vote[] = [];
const EMPTY_BLOCKS: Block[] = [];

export function App() {
  const [bundle, setBundle] = useState<DataBundle | null>(null);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("stats");
  const setRange = useTimeStore((s) => s.setRange);
  const setCurrentTime = useTimeStore((s) => s.setCurrentTime);
  const excludedVersions = useFilterStore((s) => s.excludedVersions);

  const [pyroQuote, setPyroQuote] = useState(() => PYRO_QUOTES[0]);
  const rerollPyroQuote = () => {
    setPyroQuote((current) => {
      const pool = PYRO_QUOTES.filter((q) => q !== current);
      return pool[Math.floor(Math.random() * pool.length)] ?? current;
    });
  };

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
    if (excludedVersions.size === 0) return bundle.votes;
    return bundle.votes.filter(
      (v) => !excludedVersions.has(cleanVersion(v.block.version)),
    );
  }, [bundle, excludedVersions]);

  const filteredBlocks = useMemo<Block[]>(() => {
    if (!bundle) return EMPTY_BLOCKS;
    if (excludedVersions.size === 0) return bundle.blocks;
    return bundle.blocks.filter(
      (b) => !excludedVersions.has(cleanVersion(b.version)),
    );
  }, [bundle, excludedVersions]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-titles">
          <h1>Is Every Block Someone's Favorite?</h1>
          <p className="app-subtitle">
            A Minecraft survey by{" "}
            <span
              className="pyro"
              onMouseEnter={rerollPyroQuote}
              onFocus={rerollPyroQuote}
            >
              <a
                href="https://twitch.tv/pyroscythe"
                className="pyro-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pyroscythe
              </a>
              <span className="pyro-tooltip" role="tooltip">
                <img
                  className="pyro-tooltip-avatar"
                  src="https://static-cdn.jtvnw.net/jtv_user_pictures/608f9be7-2606-4d9b-821e-f700b7440a82-profile_image-70x70.png"
                  alt=""
                  width={40}
                  height={40}
                />
                <span className="pyro-tooltip-quote">{pyroQuote}</span>
              </span>
            </span>
          </p>
        </div>
        <div className="app-header-links">
          <a
            href="https://forms.gle/VxQmxgHRhSGEvcYi6"
            className="vote-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            CAST YOUR VOTE!
          </a>
        </div>
        <div className="app-header-controls">
          <LastRefreshedIndicator buildInfo={buildInfo} />
          <NormalizeToggle />
          <GroupToggle />
          {bundle && <VersionFilter blocks={bundle.blocks} />}
          <TabSwitcher active={activeTab} onChange={setActiveTab} />
        </div>
      </header>

      <main className="app-main">
        {error ? (
          <div className="error-pane">
            <strong>failed to load data:</strong> {error}
          </div>
        ) : !bundle ? (
          <div className="loading-pane">loading data…</div>
        ) : bundle.votes.length === 0 ? (
          <div className="error-pane">
            no votes mapped to any block
          </div>
        ) : activeTab === "stats" ? (
          <StatsPage votes={filteredVotes} blocks={filteredBlocks} />
        ) : activeTab === "colors" ? (
          <ColorsPage
            votes={filteredVotes}
            blocks={filteredBlocks}
            imageVersion={imageVersion}
            groupRepBlockByKey={bundle.groupClassifier.groupRepBlockByKey}
          />
        ) : (
          <LogisticsPage votes={filteredVotes} />
        )}
      </main>

      <Footer votes={filteredVotes} totalVotes={filteredVotes.length} />
    </div>
  );
}

interface FooterProps {
  votes: Vote[];
  totalVotes: number;
}

function Footer({ votes, totalVotes }: FooterProps) {
  const slice = useVotesUpTo(votes);
  return (
    <footer className="app-footer">
      <TimeScrubber voteCount={slice.count} totalVotes={totalVotes} />
    </footer>
  );
}
