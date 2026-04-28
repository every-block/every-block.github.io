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
    label: "Begin",
    description: "Data collection begins",
  },
  {
    timestamp: new Date("2026-04-07T19:00:00Z").getTime(),
    label: "Reel #1",
    description: "Reel #1 advertising the form posted on Instagram",
  },
  {
    timestamp: new Date("2026-04-16T00:10:00Z").getTime(),
    label: "Reel #2",
    description: "Reel #2 advertising the form posted on Instagram",
  },
  {
    timestamp: new Date("2026-04-19T03:30:12Z").getTime(),
    label: "Video data collection ends",
    description: "Data collection for video stops here",
    default: true,
    stop: true
  },
  {
    timestamp: new Date("2026-04-28T22:00:00Z").getTime(),
    label: "Video premieres",
    description: "Survey video premieres on youtube",
    stop: true
  }
];
