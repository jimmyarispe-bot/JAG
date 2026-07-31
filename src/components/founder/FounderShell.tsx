import Link from "next/link";
import type { ReactNode } from "react";

type FounderShellProps = {
  fullName: string;
  roleLabel: string;
  organizationName?: string | null;
  children: ReactNode;
};

/** Thin JAG Founder Workspace chrome — presentation only. */
export function FounderShell({
  fullName,
  roleLabel,
  organizationName,
  children,
}: FounderShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#founder-main" className="skip-link">
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              JAG
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Founder Workspace</p>
              <p className="text-xs text-slate-500">
                {organizationName
                  ? `${organizationName} · Command Center`
                  : "The JAG™ Command Center"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{fullName}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
            <Link
              href="/decisions"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              My Decisions
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              AcademyOS
            </Link>
            <Link
              href="/exec"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              ECC
            </Link>
          </div>
        </div>
      </header>
      <main id="founder-main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
