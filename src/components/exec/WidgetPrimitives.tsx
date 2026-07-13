import Link from "next/link";
import type { ExecListItem } from "@/lib/exec/view-models";

export function PriorityPill({ priority }: { priority?: string }) {
  if (!priority) return null;
  const tone =
    priority === "critical" || priority === "high"
      ? "bg-rose-50 text-rose-700"
      : priority === "medium"
        ? "bg-amber-50 text-amber-800"
        : "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
      {priority}
    </span>
  );
}

export function ItemList({ items, empty = "No items" }: { items: ExecListItem[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const body = (
          <>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <PriorityPill priority={item.priority} />
                {typeof item.score === "number" && (
                  <span className="text-xs tabular-nums text-slate-500">{item.score}</span>
                )}
              </div>
            </div>
            {item.subtitle && <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>}
          </>
        );

        return (
          <li key={item.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            {item.href ? (
              <Link href={item.href} className="block transition-colors hover:text-brand-700">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ScoreHero({
  score,
  band,
  label,
}: {
  score: number;
  band?: string;
  label?: string;
}) {
  return (
    <div className="flex items-end gap-3">
      <p className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {Math.round(score)}
      </p>
      <div className="pb-1">
        {band && <p className="text-sm font-medium capitalize text-slate-700">{band}</p>}
        {label && <p className="text-xs text-slate-500">{label}</p>}
      </div>
    </div>
  );
}
