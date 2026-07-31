import { ownerLabel } from "@/lib/platform/decisions";
import type { DecisionQueue, PlatformDecision } from "@/lib/platform/decisions";
import type { DecisionAccountabilityBuckets } from "@/lib/platform/notifications";
import { isDecisionOverdue } from "@/lib/platform/notifications";

type DecisionQueuePanelProps = {
  queue: DecisionQueue | null;
  organizationNames: Record<string, string>;
  accountability?: DecisionAccountabilityBuckets | null;
  now?: string;
};

function DecisionCard({
  decision,
  organizationNames,
  now,
}: {
  decision: PlatformDecision;
  organizationNames: Record<string, string>;
  now?: string;
}) {
  const overdue = isDecisionOverdue(decision, now);
  return (
    <li className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200">
          {decision.priority}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200">
          {decision.status.replace("_", " ")}
          {overdue ? " · overdue" : ""}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">{decision.title}</p>
      <dl className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
        <div>
          <dt className="inline font-semibold text-slate-600">Organization: </dt>
          <dd className="inline">
            {decision.organizationId
              ? organizationNames[decision.organizationId] ?? decision.organizationId
              : "Platform"}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold text-slate-600">Assigned To: </dt>
          <dd className="inline">{ownerLabel(decision.owner)}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-slate-600">Due: </dt>
          <dd className="inline">
            {decision.dueDate ? new Date(decision.dueDate).toLocaleDateString() : "—"}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function StatusGroup({
  title,
  decisions,
  organizationNames,
  now,
}: {
  title: string;
  decisions: PlatformDecision[];
  organizationNames: Record<string, string>;
  now?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title} ({decisions.length})
      </p>
      {decisions.length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">None</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {decisions.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              organizationNames={organizationNames}
              now={now}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Founder Decision Queue — presentation only. */
export function DecisionQueuePanel({
  queue,
  organizationNames,
  accountability,
  now,
}: DecisionQueuePanelProps) {
  const decisions = queue?.decisions ?? [];
  const byId = new Map(decisions.map((d) => [d.id, d]));

  const pick = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((d): d is PlatformDecision => Boolean(d));

  const assigned = decisions.filter((d) => d.status === "assigned");
  const waitingAck = accountability
    ? pick(accountability.waitingAcknowledgement)
    : [];
  const inProgress = decisions.filter(
    (d) => d.status === "in_progress" || d.status === "waiting"
  );
  const completed = decisions.filter((d) => d.status === "completed");

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="decision-queue-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="decision-queue-heading" className="text-lg font-semibold text-slate-900">
          Decision Queue
        </h2>
        {queue ? (
          <p className="text-xs text-slate-500">
            {queue.counts.open + queue.counts.assigned + queue.counts.in_progress} active
          </p>
        ) : null}
      </div>

      {accountability ? (
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          <li className="rounded-full bg-amber-50 px-2 py-1 text-amber-800 ring-1 ring-amber-200">
            Unassigned: {accountability.unassigned.length}
          </li>
          <li className="rounded-full bg-rose-50 px-2 py-1 text-rose-800 ring-1 ring-rose-200">
            Overdue: {accountability.overdue.length}
          </li>
          <li className="rounded-full bg-sky-50 px-2 py-1 text-sky-800 ring-1 ring-sky-200">
            Unacknowledged: {accountability.unacknowledged.length}
          </li>
        </ul>
      ) : null}

      {decisions.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No decisions in the queue.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <StatusGroup
            title="Assigned"
            decisions={assigned}
            organizationNames={organizationNames}
            now={now}
          />
          <StatusGroup
            title="Waiting for acknowledgement"
            decisions={waitingAck}
            organizationNames={organizationNames}
            now={now}
          />
          <StatusGroup
            title="In progress"
            decisions={inProgress}
            organizationNames={organizationNames}
            now={now}
          />
          <StatusGroup
            title="Completed"
            decisions={completed}
            organizationNames={organizationNames}
            now={now}
          />
        </div>
      )}
    </section>
  );
}
