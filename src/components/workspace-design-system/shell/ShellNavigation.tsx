"use client";

import Link from "next/link";
import type { WdsNavItem } from "../types";
import { cn } from "../utils";

interface ShellNavigationProps {
  items: WdsNavItem[];
  variant?: "tabs" | "pills";
  className?: string;
  ariaLabel?: string;
}

export function ShellNavigation({
  items,
  variant = "tabs",
  className,
  ariaLabel = "Workspace navigation",
}: ShellNavigationProps) {
  return (
    <nav aria-label={ariaLabel} className={cn("overflow-x-auto", className)}>
      <ul
        className={cn(
          "flex gap-1",
          variant === "tabs" && "border-b border-slate-200",
          variant === "pills" && "rounded-xl bg-slate-100 p-1"
        )}
      >
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors",
                variant === "tabs" && "border-b-2 px-3 py-2.5 -mb-px",
                variant === "pills" && "rounded-lg px-3 py-2",
                item.active
                  ? variant === "tabs"
                    ? "border-brand-600 text-brand-600"
                    : "bg-white text-brand-700 shadow-sm"
                  : variant === "tabs"
                    ? "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    : "text-slate-600 hover:text-slate-900"
              )}
              aria-current={item.active ? "page" : undefined}
            >
              {item.icon}
              {item.label}
              {item.badge !== undefined && (
                <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
