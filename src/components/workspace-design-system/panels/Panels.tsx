"use client";

import Link from "next/link";
import type { WdsFilterOption, WdsQuickAction } from "../types";
import { cn } from "../utils";

interface FilterPanelProps {
  title?: string;
  options: WdsFilterOption[];
  activeId?: string;
  onSelect?: (id: string) => void;
  paramName?: string;
  className?: string;
}

export function FilterPanel({
  title = "Filters",
  options,
  activeId,
  onSelect,
  className,
}: FilterPanelProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-1">
        {options.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => onSelect?.(opt.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                activeId === opt.id ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span>{opt.label}</span>
              {opt.count !== undefined && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{opt.count}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailDrawer({ open, onClose, title, children, footer }: DetailDrawerProps) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-slate-900/40" aria-label="Close drawer" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="wds-drawer-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="wds-drawer-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-slate-100 p-5">{footer}</div>}
      </aside>
    </>
  );
}

interface QuickActionsPanelProps {
  actions: WdsQuickAction[];
  title?: string;
  className?: string;
}

export function QuickActionsPanel({ actions, title = "Quick actions", className }: QuickActionsPanelProps) {
  const variantClass = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-brand-600 hover:bg-brand-50",
  };

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {actions.map((action) => (
          <li key={action.id}>
            {action.href ? (
              <Link
                href={action.href}
                className={cn(
                  "block w-full rounded-xl px-3 py-2 text-center text-sm font-medium transition-colors",
                  variantClass[action.variant ?? "secondary"]
                )}
              >
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className={cn(
                  "w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  variantClass[action.variant ?? "secondary"]
                )}
              >
                {action.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SidePanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SidePanel({ title, children, className }: SidePanelProps) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
