export interface TimelineEvent {
  timestamp: number;
  label: string;
  description: string;
  // start the time bar here on initial page load
  default?: boolean;
  // pause playback when the cursor reaches this timestamp
  stop?: boolean;
}

export const EVENTS: readonly TimelineEvent[] = [
  {
    timestamp: new Date("2026-04-06T19:58:19Z").getTime(),
    label: "Data collection begins",
    description: "Data collection begins.",
  },
  {
    timestamp: new Date("2026-04-19T03:30:12Z").getTime(),
    label: "Video data collection ends",
    description: "Video data collection ends.",
    default: true,
    stop: true
  }
];
