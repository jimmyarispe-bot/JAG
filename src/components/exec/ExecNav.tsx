"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EXEC_NAV, isExecNavActive } from "@/lib/exec/navigation";
import { cn } from "@/components/workspace-design-system/utils";

export function ExecNav() {
  const pathname = usePathname();
  const enabled = EXEC_NAV.filter((item) => item.phase === 1);
  const upcoming = EXEC_NAV.filter((item) => item.phase !== 1);

  return (
    <nav aria-label="Executive Command Center" className="flex flex-col gap-1">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Command Center
      </p>
      {enabled.map((item) => {
        const active = isExecNavActive(pathname, item);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}
      {upcoming.length > 0 && (
        <details className="mt-3 px-1">
          <summary className="cursor-pointer px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Coming soon
          </summary>
          <ul className="mt-1 space-y-1">
            {upcoming.map((item) => (
              <li
                key={item.id}
                className="rounded-xl px-3 py-2 text-sm text-slate-500"
                aria-disabled="true"
              >
                {item.label}
              </li>
            ))}
          </ul>
        </details>
      )}
    </nav>
  );
}
