export interface TimelineEvent {
  timestamp: number;
  label: string;
  description: string;
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
  }
];
