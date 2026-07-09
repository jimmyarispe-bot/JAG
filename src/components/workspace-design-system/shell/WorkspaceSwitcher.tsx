"use client";

import Link from "next/link";
import { useState } from "react";
import type { WdsWorkspaceOption } from "../types";
import { cn } from "../utils";

interface WorkspaceSwitcherProps {
  workspaces: WdsWorkspaceOption[];
  currentLabel?: string;
  className?: string;
}

export function WorkspaceSwitcher({ workspaces, currentLabel, className }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const active = workspaces.find((w) => w.active);
  const label = currentLabel ?? active?.label ?? "Select workspace";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
          {label.charAt(0)}
        </span>
        <span className="hidden sm:inline">{label}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Close workspace menu" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
          >
            {workspaces.map((ws) => (
              <li key={ws.id} role="option" aria-selected={ws.active}>
                <Link
                  href={ws.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block px-4 py-3 transition-colors hover:bg-slate-50",
                    ws.active && "bg-brand-50"
                  )}
                >
                  <p className="text-sm font-medium text-slate-900">{ws.label}</p>
                  {ws.description && <p className="text-xs text-slate-500">{ws.description}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
