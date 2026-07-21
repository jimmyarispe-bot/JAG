import type { ReactNode } from "react";
import { cn } from "@/components/workspace-design-system/utils";
import {
  CardSkeleton,
  ChartSkeleton,
  DashboardSkeleton,
  KpiTilesSkeleton,
  TableSkeleton,
} from "./skeletons";

export type ProgressivePageShellProps = {
  /** Page title shown in the immediate header. */
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  /** Sidebar nav labels (static — no data wait). */
  sidebarItems?: { id: string; label: string; active?: boolean }[];
  sidebarTitle?: string;
  /** Optional toolbar / action bar content (or skeleton). */
  toolbar?: ReactNode;
  /** Main content — typically skeleton widgets or streamed WidgetBoundaries. */
  children?: ReactNode;
  /** When true, render a default dashboard skeleton body. */
  showDefaultBody?: boolean;
  className?: string;
  label?: string;
};

/**
 * Immediate page chrome for progressive navigation (UX-002).
 * Renders Header, Breadcrumbs, Sidebar, Toolbar, and skeleton body
 * without waiting for data.
 */
export function ProgressivePageShell({
  title,
  subtitle,
  breadcrumbs,
  sidebarItems,
  sidebarTitle = "Workspace",
  toolbar,
  children,
  showDefaultBody = true,
  className,
  label = "Loading page…",
}: ProgressivePageShellProps) {
  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col gap-6", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <header className="space-y-2">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              {breadcrumbs.map((crumb, i) => (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden>/</span>}
                  <span className={i === breadcrumbs.length - 1 ? "font-medium text-slate-700" : undefined}>
                    {crumb.label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
        {sidebarItems && sidebarItems.length > 0 ? (
          <aside
            className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-4 lg:w-56 xl:w-64"
            aria-label={sidebarTitle}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{sidebarTitle}</p>
            <ul className="mt-3 space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      item.active
                        ? "bg-brand-50 font-medium text-brand-700"
                        : "text-slate-600"
                    )}
                  >
                    {item.label}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {toolbar !== undefined ? (
            toolbar
          ) : (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              role="toolbar"
              aria-label="Page actions"
            >
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="flex gap-2">
                <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
              </div>
            </div>
          )}

          {children ??
            (showDefaultBody ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} lines={1} label={undefined} />
                  ))}
                </div>
                <KpiTilesSkeleton count={4} />
                <div className="grid gap-6 lg:grid-cols-3">
                  <ChartSkeleton className="lg:col-span-2" />
                  <CardSkeleton lines={4} />
                </div>
                <TableSkeleton rows={6} cols={4} />
              </div>
            ) : null)}
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Compact route-level shell used by `loading.tsx` files. */
export function RouteProgressiveSkeleton({
  title = "Loading",
  subtitle,
  breadcrumbs,
  sidebarItems,
  label = "Loading page…",
}: {
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  sidebarItems?: { id: string; label: string; active?: boolean }[];
  label?: string;
}) {
  const resolvedTitle =
    title !== "Loading"
      ? title
      : label.replace(/^Loading\s+/i, "").replace(/…$/, "").trim() || "Loading";

  return (
    <ProgressivePageShell
      title={resolvedTitle}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs ?? [{ label: resolvedTitle }]}
      sidebarItems={sidebarItems}
      label={label}
      showDefaultBody={false}
    >
      <DashboardSkeleton />
    </ProgressivePageShell>
  );
}

/** Backward-compatible alias used by existing `loading.tsx` files. */
export function RouteLoadingSkeleton({
  label = "Loading page…",
  title,
  sidebarItems,
}: {
  label?: string;
  title?: string;
  sidebarItems?: { id: string; label: string; active?: boolean }[];
}) {
  return (
    <RouteProgressiveSkeleton title={title} label={label} sidebarItems={sidebarItems} />
  );
}
