import { useEffect } from "react";
import { EVENTS } from "../data/events";
import { BASE_PLAYTHROUGH_MS, useTimeStore } from "./timeStore";

const STOP_TIMESTAMPS: readonly number[] = EVENTS.filter(
  (e) => e.stop === true,
)
  .map((e) => e.timestamp)
  .sort((a, b) => a - b);

function nextStopBetween(prev: number, next: number): number | null {
  for (const t of STOP_TIMESTAMPS) {
    if (t > prev && t <= next) return t;
    if (t > next) break;
  }
  return null;
}

export function usePlaybackLoop(): void {
  useEffect(() => {
    let raf = 0;
    let lastT = 0;

    const tick = (now: number) => {
      const s = useTimeStore.getState();
      if (!s.isPlaying) {
        lastT = 0;
        return;
      }
      if (lastT === 0) {
        lastT = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = now - lastT;
      lastT = now;

      const totalDur = Math.max(1, s.endTime - s.startTime);
      const dataRate = totalDur / BASE_PLAYTHROUGH_MS;
      const advance = dt * s.speed * dataRate;
      const next = s.currentTime + advance;

      
      const stopT = nextStopBetween(s.currentTime, next);
      if (stopT !== null) {
        useTimeStore.setState({ currentTime: stopT, isPlaying: false });
        lastT = 0;
        return;
      }

      if (next >= s.endTime) {
        useTimeStore.setState({ currentTime: s.endTime, isPlaying: false });
        lastT = 0;
        return;
      }
      useTimeStore.setState({ currentTime: next });
      raf = requestAnimationFrame(tick);
    };

    const unsub = useTimeStore.subscribe((state, prev) => {
      if (state.isPlaying && !prev.isPlaying) {
        lastT = 0;
        raf = requestAnimationFrame(tick);
      } else if (!state.isPlaying && prev.isPlaying) {
        cancelAnimationFrame(raf);
        lastT = 0;
      }
    });

    // if already playing at mount, kick off immediately
    if (useTimeStore.getState().isPlaying) {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      unsub();
      cancelAnimationFrame(raf);
    };
  }, []);
}
