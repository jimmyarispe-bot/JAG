"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SCHOOL_LEADER_EXPERIENCE_NAV } from "@/lib/school-leader/experience/constants";

export function SchoolLeaderWorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mb-6 overflow-x-auto border-b border-slate-200 pb-2"
      aria-label="School leader workspace"
    >
      <ul className="flex min-w-max gap-1">
        {SCHOOL_LEADER_EXPERIENCE_NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard/school-leader" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-100 text-brand-800"
                    : "text-slate-600 hover:bg-slate-100"
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
