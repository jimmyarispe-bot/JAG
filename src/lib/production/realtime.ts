/**
 * RC11 realtime subscriptions — replace polling where appropriate.
 * Uses Supabase channels; falls back to poll mode when unavailable.
 */

export type RealtimeTopic =
  | "founder_dashboard"
  | "executive_dashboard"
  | "notifications"
  | "workflow_status"
  | "insight_updates";

export interface RealtimeSubscription {
  topic: RealtimeTopic;
  mode: "realtime" | "poll";
  channel?: string;
  pollIntervalMs?: number;
  unsubscribe: () => void;
}

type ChannelLike = {
  on: (...args: unknown[]) => ChannelLike;
  subscribe: (cb?: (status: string) => void) => unknown;
  unsubscribe?: () => void;
};

type RealtimeClient = {
  channel: (name: string) => ChannelLike;
  removeChannel?: (channel: unknown) => void;
};

const TOPIC_TABLE: Record<RealtimeTopic, { table: string; event: string }> = {
  founder_dashboard: { table: "founder_decisions", event: "*" },
  executive_dashboard: { table: "platform_activity_events", event: "INSERT" },
  notifications: { table: "platform_in_app_notifications", event: "INSERT" },
  workflow_status: { table: "platform_workflow_instances", event: "*" },
  insight_updates: { table: "jag_insights", event: "*" },
};

/**
 * Subscribe to a production topic. If supabase realtime client is missing,
 * returns poll-mode handle for the UI to refresh periodically.
 */
export function subscribeProductionTopic(
  // Accept browser/server Supabase clients without fighting overloaded channel typings.
  supabase: RealtimeClient | { channel?: unknown; removeChannel?: unknown } | null,
  topic: RealtimeTopic,
  onEvent: (payload: unknown) => void
): RealtimeSubscription {
  const meta = TOPIC_TABLE[topic];
  const client = supabase as RealtimeClient | null;
  if (!client?.channel) {
    const timer = setInterval(() => onEvent({ type: "poll", topic }), 30_000);
    return {
      topic,
      mode: "poll",
      pollIntervalMs: 30_000,
      unsubscribe: () => clearInterval(timer),
    };
  }

  const channelName = `rc11:${topic}`;
  const channel = client.channel(channelName) as ChannelLike & {
    on: (
      type: "postgres_changes",
      filter: Record<string, string>,
      cb: (payload: unknown) => void
    ) => ChannelLike;
  };
  channel
    .on(
      "postgres_changes",
      { event: meta.event, schema: "public", table: meta.table },
      (payload) => onEvent(payload)
    )
    .subscribe();

  return {
    topic,
    mode: "realtime",
    channel: channelName,
    unsubscribe: () => {
      try {
        client.removeChannel?.(channel);
      } catch {
        channel.unsubscribe?.();
      }
    },
  };
}

export function listRealtimeTopics(): RealtimeTopic[] {
  return [
    "founder_dashboard",
    "executive_dashboard",
    "notifications",
    "workflow_status",
    "insight_updates",
  ];
}
