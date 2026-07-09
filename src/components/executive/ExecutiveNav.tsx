"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FOUNDERS_EXECUTIVE_NAV } from "@/lib/dashboard/founders-navigation";

export function ExecutiveNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {FOUNDERS_EXECUTIVE_NAV.map((item) => {
        const active =
          "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
