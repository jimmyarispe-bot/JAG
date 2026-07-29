import Link from "next/link";
import { ADMISSIONS_PUBLIC_NAV } from "@/lib/admissions/experience/constants";

export function AdmissionsPublicShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/admissions" className="text-xl font-semibold tracking-tight text-slate-900">
              Admissions
            </Link>
            <p className="text-xs text-slate-500">
              Inquire · Apply · Enroll — powered by AcademyOS
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-3 gap-y-2 text-sm text-slate-600"
            aria-label="Admissions"
          >
            {ADMISSIONS_PUBLIC_NAV.filter((n) => n.href !== "/admissions").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {(title || subtitle) && (
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            {title ? (
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-base text-slate-600">{subtitle}</p>
            ) : null}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Questions? Visit Contact or submit an Interest Form.</p>
          <div className="flex gap-4">
            <Link href="/apply" className="font-medium text-slate-800 hover:underline">
              Start inquiry
            </Link>
            <Link href="/apply/portal" className="font-medium text-slate-800 hover:underline">
              Application dashboard
            </Link>
            <Link href="/login" className="font-medium text-slate-800 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
