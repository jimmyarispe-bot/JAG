import Link from "next/link";
import type { JagWorkItem, JagWorkQueue } from "@/lib/platform/jag-work";
import { CardShell } from "@/components/workspace-design-system";
import { EmptyState } from "@/components/experience-system/feedback";

const PRIORITY_TONE: Record<JagWorkItem["priority"], string> = {
  critical: "border-rose-300 bg-rose-50/60",
  high: "border-amber-300 bg-amber-50/50",
  medium: "border-slate-200 bg-white",
  low: "border-slate-200 bg-slate-50/80",
};

const STATUS_LABEL: Record<JagWorkItem["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  awaiting_review: "Awaiting review",
  ready: "Ready",
  completed: "Completed",
};

export function JagWorkItemCard({ item }: { item: JagWorkItem }) {
  return (
    <Link
      href={item.href}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl"
    >
      <CardShell
        className={`transition-colors hover:border-brand-200 ${PRIORITY_TONE[item.priority]}`}
        interactive
        padding="md"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {item.workType.replace(/_/g, " ")}
            </p>
            <h3 className="mt-0.5 font-semibold text-slate-900">{item.title}</h3>
            {item.description && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.description}</p>}
            {item.studentName && (
              <p className="mt-1 text-xs text-brand-700">{item.studentName}</p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
            {STATUS_LABEL[item.status]}
          </span>
        </div>

        <p className="mt-3 text-sm text-slate-700">
          <span className="font-medium">Next: </span>
          {item.recommendedNextAction}
        </p>

        {(item.requiredCapabilityKey || item.blockingDependencies.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
            {item.requiredCapabilityKey && (
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-800">Capability required</span>
            )}
            {item.blockingDependencies.length > 0 && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
                {item.blockingDependencies.length} blocker{item.blockingDependencies.length === 1 ? "" : "s"}
              </span>
            )}
            {item.dueDate && <span>Due {item.dueDate}</span>}
          </div>
        )}
      </CardShell>
    </Link>
  );
}

export function JagWorkPanel({
  queue,
  perspective,
}: {
  queue: JagWorkQueue;
  perspective: string;
}) {
  const label =
    queue.perspectiveCatalog.find((p) => p.id === perspective)?.label ?? perspective;
  const items = queue.perspectives[perspective] ?? [];

  return (
    <section aria-label={label} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {items.length} work item{items.length === 1 ? "" : "s"} — resolved through JAG Profile, Execution Engine, and platform work.
        </p>
      </div>

      {items.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <JagWorkItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState title="No work in this queue" description="You're caught up for this perspective." />
      )}
    </section>
  );
}
