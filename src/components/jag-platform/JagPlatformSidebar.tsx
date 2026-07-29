import Link from "next/link";
import { listJagPlatformNavForSession } from "@/lib/jag-platform/navigation";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { JAG_PLATFORM_VERSION } from "@/lib/jag-platform/versioning";

export function JagPlatformSidebar({
  pathname,
  session,
}: {
  readonly pathname: string;
  readonly session?: JagPlatformSession | null;
}) {
  const items = listJagPlatformNavForSession(session ?? null);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-5 py-5">
        <p className="text-xl font-semibold tracking-tight text-white">The JAG™</p>
        <p className="mt-1 text-xs leading-snug text-slate-400">
          Organizational Intelligence Operating System
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">
          {JAG_PLATFORM_VERSION.platformVersion}
        </p>
      </div>
      <nav className="flex-1 px-3 py-4" aria-label="The JAG Platform">
        <ul className="space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={
                    active
                      ? "block rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white"
                      : "block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
