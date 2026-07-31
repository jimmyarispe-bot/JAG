import Link from "next/link";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/overview", label: "Platform" },
  { href: "/solutions", label: "Solutions" },
  { href: "/products", label: "Products" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            The JAG™
          </Link>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600"
            aria-label="Marketing"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/jag/login"
              className="text-slate-600 hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/start"
              className="rounded-md bg-slate-900 px-3 py-2 font-medium text-white hover:bg-slate-800"
            >
              Start Your Pilot
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>The JAG™ — Organizational Intelligence Operating System</p>
          <p>© {new Date().getFullYear()} The JAG. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
