"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EXECUTIVE_EXPERIENCE_NAV } from "@/lib/executive/experience/constants";

export function ExecutiveWorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mb-2 overflow-x-auto border-b border-slate-200 pb-2"
      aria-label="Executive workspace"
    >
      <ul className="flex min-w-max gap-1">
        {EXECUTIVE_EXPERIENCE_NAV.map((item) => {
          const exact = "exact" in item && item.exact;
          const active = exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
