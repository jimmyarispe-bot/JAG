"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  subscribeProductionTopic,
  type RealtimeTopic,
} from "@/lib/production/realtime";

interface Props {
  topic: RealtimeTopic;
  label?: string;
  onEvent?: () => void;
}

/**
 * RC11 — replaces silent polling with Supabase realtime (poll fallback).
 */
export function ProductionRealtimeBadge({
  topic,
  label = "Live",
  onEvent,
}: Props) {
  const [mode, setMode] = useState<"realtime" | "poll" | "connecting">(
    "connecting"
  );
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const sub = subscribeProductionTopic(supabase, topic, () => {
      setPulse((n) => n + 1);
      onEvent?.();
    });
    setMode(sub.mode);
    return () => sub.unsubscribe();
  }, [topic, onEvent]);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
      title={`${topic}: ${mode}${pulse ? ` · ${pulse} updates` : ""}`}
      aria-live="polite"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          mode === "realtime" ? "bg-emerald-500" : "bg-amber-400"
        }`}
      />
      {label} · {mode === "connecting" ? "…" : mode}
      {pulse > 0 ? ` · ${pulse}` : ""}
    </span>
  );
}
