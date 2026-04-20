import { useState } from "react";
import type { BuildInfo } from "@/data/load-build-info";
import type { Block, DataBundle, Vote } from "@/types/domain";
import { TimeScrubber } from "@/containers/TimeScrubber";
import { BlockFilter } from "@/containers/BlockFilter";
import { VersionFilter } from "@/containers/VersionFilter";
import { LinkButton } from "@/ui/LinkButton";
import { NormalizeToggle } from "@/containers/NormalizeToggle";
import { GroupToggle } from "@/containers/GroupToggle";
import { LastRefreshedIndicator } from "@/containers/LastRefreshedIndicator";
import { TabSwitcher, type TabId } from "@/containers/TabSwitcher";
import { StatsPage } from "@/pages/StatsPage";
import { ColorsPage } from "@/pages/ColorsPage";
import { LogisticsPage } from "@/pages/LogisticsPage";
import { PYRO_QUOTES } from "@/data/quotes";

interface Props {
  error: string | null;
  bundle: DataBundle | null;
  buildInfo: BuildInfo | null;
  filteredVotes: Vote[];
  filteredBlocks: Block[];
  imageVersion: number;
  voteSliceCount: number;
}

export function Dashboard({
  error,
  bundle,
  buildInfo,
  filteredVotes,
  filteredBlocks,
  imageVersion,
  voteSliceCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("stats");
  const [pyroQuote, setPyroQuote] = useState(() => PYRO_QUOTES[0]);

  const rerollPyroQuote = () => {
    setPyroQuote((current) => {
      const pool = PYRO_QUOTES.filter((q) => q !== current);
      return pool[Math.floor(Math.random() * pool.length)] ?? current;
    });
  };

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
          <LinkButton
            href="https://forms.gle/VxQmxgHRhSGEvcYi6"
            target="_blank"
          >
            CAST YOUR VOTE!
          </LinkButton>
          <LinkButton
            href=""
            target="_blank"
            tone="red"
            disabled
            sparkles
          >
            🍳 VIDEO COOKING..
          </LinkButton>
        </div>
        <div className="app-header-controls">
          <LastRefreshedIndicator buildInfo={buildInfo} />
          <NormalizeToggle />
          <GroupToggle />
          {bundle && <BlockFilter blocks={bundle.blocks} />}
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
          <div className="error-pane">no votes mapped to any block</div>
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

      <footer className="app-footer">
        <TimeScrubber
          voteCount={voteSliceCount}
          totalVotes={filteredVotes.length}
        />
      </footer>
    </div>
  );
}
