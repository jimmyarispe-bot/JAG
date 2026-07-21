import { cn } from "@/components/workspace-design-system/utils";
import { SkeletonBlock, SkeletonBone } from "./primitives";

/** Card placeholder — empty card shell with pulse blocks. */
export function CardSkeleton({
  className,
  lines = 2,
  label = "Loading card…",
}: {
  className?: string;
  lines?: number;
  label?: string;
}) {
  return (
    <SkeletonBlock
      label={label}
      className={cn("rounded-2xl border border-slate-200 bg-white p-5", className)}
    >
      <SkeletonBone className="h-4 w-2/5" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBone key={i} className={cn("h-3", i === lines - 1 ? "w-3/5" : "w-full")} />
        ))}
      </div>
    </SkeletonBlock>
  );
}

/** Table placeholder with header + rows. */
export function TableSkeleton({
  className,
  rows = 6,
  cols = 4,
  label = "Loading table…",
}: {
  className?: string;
  rows?: number;
  cols?: number;
  label?: string;
}) {
  return (
    <SkeletonBlock
      label={label}
      className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white", className)}
    >
      <div className="grid gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:grid-cols-none">
        <div className="flex gap-3">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBone key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-3 px-4 py-3">
            {Array.from({ length: cols }).map((_, col) => (
              <SkeletonBone
                key={col}
                className={cn("h-3 flex-1", col === 0 && "max-w-[30%]")}
              />
            ))}
          </div>
        ))}
      </div>
    </SkeletonBlock>
  );
}

/** Chart placeholder. */
export function ChartSkeleton({
  className,
  height = "h-56",
  label = "Loading chart…",
}: {
  className?: string;
  height?: string;
  label?: string;
}) {
  return (
    <SkeletonBlock
      label={label}
      className={cn("rounded-2xl border border-slate-200 bg-white p-5", className)}
    >
      <SkeletonBone className="mb-4 h-4 w-36" />
      <div className={cn("flex items-end gap-2", height)}>
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <SkeletonBone
            key={i}
            className="flex-1 rounded-t-md rounded-b-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </SkeletonBlock>
  );
}

/** Form placeholder. */
export function FormSkeleton({
  className,
  fields = 4,
  label = "Loading form…",
}: {
  className?: string;
  fields?: number;
  label?: string;
}) {
  return (
    <SkeletonBlock
      label={label}
      className={cn("space-y-4 rounded-2xl border border-slate-200 bg-white p-5", className)}
    >
      <SkeletonBone className="h-5 w-40" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBone className="h-3 w-24" />
          <SkeletonBone className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <SkeletonBone className="h-10 w-28 rounded-xl" />
        <SkeletonBone className="h-10 w-20 rounded-xl" />
      </div>
    </SkeletonBlock>
  );
}

/** List placeholder. */
export function ListSkeleton({
  className,
  rows = 5,
  label = "Loading list…",
}: {
  className?: string;
  rows?: number;
  label?: string;
}) {
  return (
    <SkeletonBlock
      label={label}
      className={cn("space-y-3 rounded-2xl border border-slate-200 bg-white p-4", className)}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBone className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBone className="h-3 w-2/5" />
            <SkeletonBone className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </SkeletonBlock>
  );
}

/** KPI / metric tile placeholder. */
export function KpiTileSkeleton({
  className,
  label = "Loading metric…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <SkeletonBlock
      label={label}
      className={cn("rounded-2xl border border-slate-200 bg-white p-5", className)}
    >
      <SkeletonBone className="h-3 w-24" />
      <SkeletonBone className="mt-3 h-8 w-16" />
      <SkeletonBone className="mt-2 h-3 w-32" />
    </SkeletonBlock>
  );
}

/** Grid of KPI tiles. */
export function KpiTilesSkeleton({
  className,
  count = 4,
  label = "Loading metrics…",
}: {
  className?: string;
  count?: number;
  label?: string;
}) {
  return (
    <SkeletonBlock label={label} className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <KpiTileSkeleton key={i} label={undefined} />
      ))}
    </SkeletonBlock>
  );
}

/** Dashboard composition — KPIs + chart + table. */
export function DashboardSkeleton({
  className,
  label = "Loading dashboard…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <SkeletonBlock label={label} className={cn("space-y-6", className)}>
      <KpiTilesSkeleton count={4} />
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartSkeleton className="lg:col-span-2" />
        <ListSkeleton rows={4} />
      </div>
      <TableSkeleton rows={5} cols={4} />
    </SkeletonBlock>
  );
}

/** Executive widget placeholder (insights / decision / financial panels). */
export function ExecutiveWidgetSkeleton({
  className,
  variant = "panel",
  label = "Loading executive widget…",
}: {
  className?: string;
  variant?: "panel" | "insights" | "scorecard";
  label?: string;
}) {
  if (variant === "insights") {
    return (
      <SkeletonBlock
        label={label}
        className={cn("rounded-2xl border border-slate-200 bg-white p-5", className)}
      >
        <SkeletonBone className="h-4 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-3">
              <SkeletonBone className="h-3 w-1/3" />
              <SkeletonBone className="mt-2 h-3 w-full" />
              <SkeletonBone className="mt-1 h-3 w-4/5" />
            </div>
          ))}
        </div>
      </SkeletonBlock>
    );
  }

  if (variant === "scorecard") {
    return (
      <SkeletonBlock
        label={label}
        className={cn("rounded-2xl border border-slate-200 bg-white p-5", className)}
      >
        <SkeletonBone className="h-4 w-36" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-3">
              <SkeletonBone className="h-3 w-28" />
              <SkeletonBone className="h-3 w-10" />
            </div>
          ))}
        </div>
      </SkeletonBlock>
    );
  }

  return (
    <SkeletonBlock
      label={label}
      className={cn("rounded-2xl border border-slate-200 bg-white p-5", className)}
    >
      <SkeletonBone className="h-4 w-44" />
      <SkeletonBone className="mt-4 h-40 w-full rounded-xl" />
    </SkeletonBlock>
  );
}
