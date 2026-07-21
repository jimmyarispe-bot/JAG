"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EXEC_NAV_ENABLED, isExecNavActive } from "@/lib/exec/navigation";
import { cn } from "@/components/workspace-design-system/utils";

export function ExecNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Executive Command Center" className="flex flex-col gap-1">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Command Center
      </p>
      {EXEC_NAV_ENABLED.map((item) => {
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
    </nav>
  );
}
