"use client";

import Link from "next/link";
import { Suspense, useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlobalShell, ShellSearch, ShellNavigation } from "@/components/workspace-design-system";
import type { XesBreadcrumb, XesFavoriteItem, XesNavItem, XesRecentItem, XesWorkspaceOption } from "../types";
import { cn } from "@/components/workspace-design-system/utils";

export { GlobalShell as GlobalNavigation, ShellNavigation as WorkspaceNavigation };

export function Breadcrumbs({ items, className }: { items: XesBreadcrumb[]; className?: string }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 text-xs text-slate-500", className)}>
      {items.map((crumb, i) => (
        <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden>/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-brand-600">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-700">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function ContextNavigation({ items, className }: { items: XesNavItem[]; className?: string }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Context" className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            item.active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}
          aria-current={item.active ? "page" : undefined}
        >
          {item.label}
          {item.badge !== undefined && (
            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{item.badge}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function useRecentItems(storageKey: string, max = 8) {
  const [items, setItems] = useState<XesRecentItem[]>(() =>
    readStorage<XesRecentItem[]>(storageKey, [])
  );

  const track = useCallback(
    (entry: Omit<XesRecentItem, "visitedAt">) => {
      setItems((prev) => {
        const next = [
          { ...entry, visitedAt: new Date().toISOString() },
          ...prev.filter((i) => i.id !== entry.id),
        ].slice(0, max);
        writeStorage(storageKey, next);
        return next;
      });
    },
    [max, storageKey]
  );

  return { items, track };
}

export function useFavorites(storageKey: string) {
  const [items, setItems] = useState<XesFavoriteItem[]>(() =>
    readStorage<XesFavoriteItem[]>(storageKey, [])
  );

  const toggle = useCallback(
    (entry: XesFavoriteItem) => {
      setItems((prev) => {
        const exists = prev.some((i) => i.id === entry.id);
        const next = exists ? prev.filter((i) => i.id !== entry.id) : [...prev, entry];
        writeStorage(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const isFavorite = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  return { items, toggle, isFavorite };
}

export function RecentItems({ items, title = "Recent", className }: { items: XesRecentItem[]; title?: string; className?: string }) {
  if (!items.length) return null;
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-3", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="block truncate rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Favorites({ items, title = "Favorites", className }: { items: XesFavoriteItem[]; title?: string; className?: string }) {
  if (!items.length) return null;
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-3", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="block truncate rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              ★ {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UniversalSearch({
  placeholder = "Search workspace…",
  paramName = "q",
  shortcutHint = "Ctrl+K",
  className,
  onSearch,
}: {
  placeholder?: string;
  paramName?: string;
  shortcutHint?: string;
  className?: string;
  onSearch?: (query: string) => void;
}) {
  return (
    <div className={cn("relative", className)}>
      <Suspense fallback={null}>
        <ShellSearch placeholder={placeholder} paramName={paramName} onSearch={onSearch} />
      </Suspense>
      {shortcutHint && (
        <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">
          {shortcutHint}
        </span>
      )}
    </div>
  );
}

export function WorkspaceNavLinks({ items }: { items: XesNavItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              item.active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
            aria-current={item.active ? "page" : undefined}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">{item.badge}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export { useKeyboardShortcuts } from "../interaction";
export type { XesNotification } from "../types";
export type { XesNavItem, XesWorkspaceOption, XesBreadcrumb, XesRecentItem, XesFavoriteItem };
