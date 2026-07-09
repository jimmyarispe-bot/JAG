import type { ReactNode } from "react";
import { cn } from "@/components/workspace-design-system/utils";

export interface PageLayoutProps {
  header?: ReactNode;
  actionBar?: ReactNode;
  contextPanel?: ReactNode;
  insightPanel?: ReactNode;
  activityPanel?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Standard page framework — header, action bar, context, main, insight, activity. */
export function PageLayout({
  header,
  actionBar,
  contextPanel,
  insightPanel,
  activityPanel,
  children,
  className,
}: PageLayoutProps) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-6", className)}>
      {header}
      {actionBar}
      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
        {contextPanel && (
          <aside className="w-full shrink-0 lg:w-56 xl:w-64" aria-label="Context">
            {contextPanel}
          </aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <main className="min-w-0 flex-1 space-y-6">{children}</main>
          {activityPanel && (
            <footer className="border-t border-slate-200 pt-4" aria-label="Activity">
              {activityPanel}
            </footer>
          )}
        </div>
        {insightPanel && (
          <aside className="w-full shrink-0 lg:w-72 xl:w-80" aria-label="Insights">
            {insightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        {breadcrumbs}
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3",
        className
      )}
      role="toolbar"
      aria-label="Page actions"
    >
      {children}
    </div>
  );
}

export function ContextPanel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4", className)}>
      {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
      <div className={title ? "mt-3" : undefined}>{children}</div>
    </div>
  );
}

export function InsightPanelRegion({ title = "Insights", children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-slate-50/50 p-4", className)}>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

export function ActivityPanelRegion({ title = "Activity", children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-100 bg-slate-50/80 p-4", className)}>
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
