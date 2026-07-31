import { ownerLabel, type PlatformDecision } from "@/lib/platform/decisions";
import type { AssigneeDecisionBuckets } from "@/lib/platform/notifications";

type AssigneeWorkPanelProps = {
  decisions: PlatformDecision[];
  buckets: AssigneeDecisionBuckets;
  organizationNames: Record<string, string>;
};

function Group({
  title,
  items,
  organizationNames,
}: {
  title: string;
  items: PlatformDecision[];
  organizationNames: Record<string, string>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title} ({items.length})
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">None</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((d) => (
            <li
              key={d.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
            >
              <p className="text-sm font-medium text-slate-900">{d.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {d.organizationId
                  ? organizationNames[d.organizationId] ?? d.organizationId
                  : "Platform"}
                {" · "}
                {ownerLabel(d.owner)}
                {" · "}
                {d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "No due date"}
                {" · "}
                {d.status.replace("_", " ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Executive Director / assignee work view — same DecisionService data, filtered. */
export function AssigneeWorkPanel({
  decisions,
  buckets,
  organizationNames,
}: AssigneeWorkPanelProps) {
  const byId = new Map(decisions.map((d) => [d.id, d]));
  const pick = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((d): d is PlatformDecision => Boolean(d));

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="my-decisions-heading"
    >
      <h2 id="my-decisions-heading" className="text-lg font-semibold text-slate-900">
        My Decisions
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Assigned work from the Decision Center
      </p>
      <div className="mt-4 space-y-4">
        <Group
          title="My Decisions"
          items={pick(buckets.myDecisions)}
          organizationNames={organizationNames}
        />
        <Group
          title="Due Today"
          items={pick(buckets.dueToday)}
          organizationNames={organizationNames}
        />
        <Group
          title="Overdue"
          items={pick(buckets.overdue)}
          organizationNames={organizationNames}
        />
        <Group
          title="Recently Assigned"
          items={pick(buckets.recentlyAssigned)}
          organizationNames={organizationNames}
        />
      </div>
    </section>
  );
}
