"use client";

import {
  ActionButton,
  ActionChip,
  WorkspaceActivity,
  useActionFeedback,
} from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";
import type { ActionStatus } from "@/components/experience-system/feedback/action-labels";
import { resolveMissionControlItemAction } from "@/lib/platform/automation/server-actions";
import type { MissionControlCommandCenter } from "@/lib/platform/automation/mission-control-compose";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-slate-100 text-slate-700 border-slate-200",
  normal: "bg-slate-100 text-slate-700 border-slate-200",
  low: "bg-blue-50 text-blue-700 border-blue-100",
};

const RESOLVE_LABELS = {
  idle: "Resolve",
  loading: "Resolving…",
  processing: "Checking compliance…",
  success: "✓ Resolved",
  error: "Unable to resolve",
} as const;

type PriorityItem = MissionControlCommandCenter["priorities"]["critical"][number];
type FeedItem = MissionControlCommandCenter["feed"][number];

function ResolveButton({
  status,
  errorMessage,
  onResolve,
}: {
  status: ActionStatus;
  errorMessage: string | null;
  onResolve: () => void;
}) {
  return (
    <ActionButton
      type="button"
      status={status}
      verb="custom"
      variant="warning"
      size="xs"
      labels={RESOLVE_LABELS}
      errorMessage={errorMessage}
      onClick={onResolve}
    />
  );
}

function PriorityList({
  items,
  onResolve,
  resolveStatus,
  resolveError,
}: {
  items: PriorityItem[];
  onResolve?: (id: string) => void;
  resolveStatus: ActionStatus;
  resolveError: string | null;
}) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">None</p>;
  }
  return (
    <ul className="space-y-2">
      {items.slice(0, 8).map((item) => (
        <li
          key={item.id}
          className={`rounded-lg border px-3 py-2 text-sm ${SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.medium}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{item.title}</p>
              {item.description && <p className="mt-0.5 text-xs opacity-80">{item.description}</p>}
              <p className="mt-1 text-xs opacity-60">
                {item.source.replace(/_/g, " ")}
                {item.module ? ` · ${item.module}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {item.href ? (
                <ActionChip href={item.href} size="xs" variant="secondary" verb="open">
                  Open
                </ActionChip>
              ) : null}
              {item.source === "mission_control" && onResolve && (
                <ResolveButton
                  status={resolveStatus}
                  errorMessage={resolveError}
                  onResolve={() => onResolve(item.id)}
                />
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** P007 — client island for Mission Control resolve actions (priorities + alerts). */
export function MissionControlResolveIsland({
  priorities,
  feed,
}: {
  priorities: MissionControlCommandCenter["priorities"];
  feed: FeedItem[];
}) {
  const resolveAction = useActionFeedback({
    verb: "custom",
    labels: RESOLVE_LABELS,
    successToast: "✓ Item resolved.",
    errorToast: "Unable to resolve item.",
    progressLabel: "Resolving mission control item…",
  });

  function handleResolve(id: string) {
    void resolveAction.run(async () => {
      const result = await resolveMissionControlItemAction(id);
      assertActionResult(result);
      return result;
    });
  }

  return (
    <>
      <WorkspaceActivity
        active={resolveAction.isBusy}
        label={
          resolveAction.status === "processing"
            ? "Scanning risks…"
            : "Resolving…"
        }
        className="mb-2"
      />
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mission Priorities</h3>
        <p className="mt-1 text-sm text-slate-600">
          Auto-ranked from JAG Work™, Rules Engine™, Operational Loop™, and AI Recommendations™.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {(["critical", "high", "medium", "low"] as const).map((tier) => (
            <article key={tier} className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold capitalize text-slate-900">
                {tier} ({priorities[tier].length})
              </h4>
              <div className="mt-3">
                <PriorityList
                  items={priorities[tier]}
                  resolveStatus={resolveAction.status}
                  resolveError={resolveAction.errorMessage}
                  onResolve={handleResolve}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Mission Alerts</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {feed.length === 0 && (
            <p className="text-sm text-slate-500">No open mission control items.</p>
          )}
          {feed.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 ${SEVERITY_COLORS[item.severity ?? "normal"] ?? SEVERITY_COLORS.normal}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs opacity-80">
                    {item.module} · {item.item_type.replace(/_/g, " ")} ·{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  {item.body && <p className="mt-2 text-sm opacity-90">{item.body}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {item.href ? (
                    <ActionChip href={item.href} size="xs" variant="secondary" verb="open">
                      Open record
                    </ActionChip>
                  ) : null}
                  <ResolveButton
                    status={resolveAction.status}
                    errorMessage={resolveAction.errorMessage}
                    onResolve={() => handleResolve(item.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
