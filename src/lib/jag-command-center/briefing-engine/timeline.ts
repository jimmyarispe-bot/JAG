/**
 * Resolve briefing time windows. Application layer only.
 */

import type { JagBriefingTimeline, JagBriefingWindow } from "./types";

export function resolveBriefingWindow(input: {
  timeline: JagBriefingTimeline;
  now?: Date;
  customStart?: string;
  customEnd?: string;
}): JagBriefingWindow | { error: string } {
  const now = input.now ?? new Date();
  const end = now.toISOString();

  if (input.timeline === "custom") {
    if (!input.customStart?.trim() || !input.customEnd?.trim()) {
      return { error: "Custom timeline requires start and end dates." };
    }
    const startMs = Date.parse(input.customStart);
    const endMs = Date.parse(input.customEnd);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return { error: "Custom dates are invalid." };
    }
    if (startMs > endMs) {
      return { error: "Custom start must be before end." };
    }
    return {
      timeline: "custom",
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      label: `Custom · ${input.customStart.slice(0, 10)} – ${input.customEnd.slice(0, 10)}`,
    };
  }

  const start = startForPreset(input.timeline, now);
  return {
    timeline: input.timeline,
    start: start.toISOString(),
    end,
    label: labelForPreset(input.timeline),
  };
}

export function isWithinWindow(
  iso: string | undefined,
  window: JagBriefingWindow
): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  return t >= start && t <= end;
}

function startForPreset(timeline: Exclude<JagBriefingTimeline, "custom">, now: Date): Date {
  const d = new Date(now.getTime());
  if (timeline === "today") {
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    );
  }
  if (timeline === "this_week") {
    const day = d.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff)
    );
  }
  if (timeline === "this_month") {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }
  // quarter
  const qMonth = Math.floor(d.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(d.getUTCFullYear(), qMonth, 1));
}

function labelForPreset(timeline: Exclude<JagBriefingTimeline, "custom">): string {
  switch (timeline) {
    case "today":
      return "Today";
    case "this_week":
      return "This Week";
    case "this_month":
      return "This Month";
    case "quarter":
      return "Quarter";
  }
}
