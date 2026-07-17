import Link from "next/link";
import { ROLE_LABELS } from "@/lib/platform/organization-platform";

const NAV = [
  { href: "/platform", label: "Platform" },
  { href: "/organizations", label: "Organizations" },
  { href: "/users", label: "Users" },
  { href: "/settings", label: "Settings" },
] as const;

export function OrgAdminShell({
  title,
  subtitle,
  children,
  activeHref,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  activeHref: (typeof NAV)[number]["href"];
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
              Organization Platform
            </p>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
            ← Dashboard
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
          {NAV.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export function RoleBadge({ role }: { role: keyof typeof ROLE_LABELS }) {
  return (
    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      {ROLE_LABELS[role]}
    </span>
  );
}
