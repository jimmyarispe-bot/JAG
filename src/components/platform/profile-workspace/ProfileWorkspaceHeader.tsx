import Link from "next/link";
import type { ProfileWorkspaceHeaderProps } from "@/lib/platform/profile/workspace/types";

export function ProfileWorkspaceHeader({
  backHref,
  backLabel = "Back",
  title,
  subtitle,
  avatar,
  badges,
  actions,
  alerts,
}: ProfileWorkspaceHeaderProps) {
  return (
    <header className="space-y-4 border-b border-slate-200/80 pb-6">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {backLabel}
        </Link>
      )}

      {alerts && <div className="space-y-2">{alerts}</div>}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {avatar && <div className="shrink-0">{avatar}</div>}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            {badges && <div className="mt-3 flex flex-wrap gap-2">{badges}</div>}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
