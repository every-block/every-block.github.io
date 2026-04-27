import { CHANGELOG_ENTRIES } from "@/data/changelog";
import { useChangelogStore } from "@/stores/changelog-store";
import { ChangelogTimeline } from "@/ui/ChangelogTimeline";
import { BottomSheet } from "@/ui/BottomSheet";

export function ChangelogOpenButton() {
  const open = useChangelogStore((s) => s.open);
  const openChangelog = useChangelogStore((s) => s.openChangelog);
  return (
    <button
      type="button"
      className="app-header-changelog"
      onClick={openChangelog}
      aria-label="Changelog"
      title="Changelog"
      aria-haspopup="dialog"
      aria-expanded={open}
      data-umami-event="changelog_open"
    >
      <ChangelogIcon />
    </button>
  );
}

export function ChangelogDialog() {
  const open = useChangelogStore((s) => s.open);
  const closeChangelog = useChangelogStore((s) => s.closeChangelog);
  return (
    <BottomSheet
      open={open}
      onClose={closeChangelog}
      title="Changelog"
      showHandle={false}
      backdropClassName="bottom-sheet-backdrop--blur"
      centerOnDesktop
    >
      <ChangelogTimeline entries={CHANGELOG_ENTRIES} />
    </BottomSheet>
  );
}

function ChangelogIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4.5 4h8.5M4.5 8h8.5M4.5 12h5.5" />
    </svg>
  );
}
