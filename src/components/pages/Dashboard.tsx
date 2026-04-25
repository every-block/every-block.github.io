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
import { useIsNarrow } from "@/hooks/use-is-narrow";
import { MobileFiltersSheet } from "@/containers/MobileFiltersSheet";

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
  const isNarrow = useIsNarrow();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const rerollPyroQuote = () => {
    setPyroQuote((current) => {
      const pool = PYRO_QUOTES.filter((q) => q !== current);
      return pool[Math.floor(Math.random() * pool.length)] ?? current;
    });
  };

  const titles = (
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
            data-umami-event="out_streamer"
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
  );

  const desktopHeader = (
    <header className="app-header">
      {titles}
      <div className="app-header-links">
        <LinkButton
          href="https://forms.gle/VxQmxgHRhSGEvcYi6"
          target="_blank"
          data-umami-event="vote_cta"
          data-umami-event-placement="header"
        >
          VOTE
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
        <LastRefreshedIndicator buildInfo={buildInfo} totalVotes={filteredVotes.length} />
        <NormalizeToggle />
        <GroupToggle />
        {bundle && <BlockFilter blocks={bundle.blocks} />}
        {bundle && <VersionFilter blocks={bundle.blocks} />}
        <TabSwitcher active={activeTab} onChange={setActiveTab} />
      </div>
    </header>
  );

  const mobileHeader = (
    <header className="app-header app-header--mobile">
      <div className="app-header-mobile-top">
        {titles}
        <div className="app-header-mobile-actions">
          <button
            type="button"
            className="app-header-filters-btn"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            data-umami-event="filters_open"
          >
            <FiltersIcon />
            <span>Filters</span>
          </button>
          <LinkButton
            href="https://forms.gle/VxQmxgHRhSGEvcYi6"
            target="_blank"
            size="sm"
            data-umami-event="vote_cta"
            data-umami-event-placement="mobile"
          >
            VOTE
          </LinkButton>
        </div>
      </div>
      <div className="app-header-mobile-tabs">
        <TabSwitcher active={activeTab} onChange={setActiveTab} />
      </div>
    </header>
  );

  return (
    <div className={`app${isNarrow ? " app--mobile" : ""}`}>
      {isNarrow ? mobileHeader : desktopHeader}

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
          <StatsPage
            votes={filteredVotes}
            blocks={filteredBlocks}
            isNarrow={isNarrow}
          />
        ) : activeTab === "colors" ? (
          <ColorsPage
            votes={filteredVotes}
            blocks={filteredBlocks}
            imageVersion={imageVersion}
            groupRepBlockByKey={bundle.groupClassifier.groupRepBlockByKey}
            isNarrow={isNarrow}
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

      {isNarrow && (
        <MobileFiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          blocks={bundle?.blocks ?? null}
          buildInfo={buildInfo}
          totalVotes={filteredVotes.length}
        />
      )}
    </div>
  );
}

function FiltersIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 4 H 14" />
      <path d="M4 8 H 12" />
      <path d="M6 12 H 10" />
    </svg>
  );
}
