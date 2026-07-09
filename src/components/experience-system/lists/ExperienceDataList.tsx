"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { XesSavedView, XesTableColumn } from "../types";
import { cn } from "@/components/workspace-design-system/utils";
import { EmptyState } from "../feedback";

function readViews(key: string): XesSavedView[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as XesSavedView[];
  } catch {
    return [];
  }
}

function writeViews(key: string, views: XesSavedView[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(views));
}

export interface ExperienceDataListProps<T extends { id: string }> {
  listKey: string;
  columns: XesTableColumn<T>[];
  rows: T[];
  caption?: string;
  emptyMessage?: string;
  filterFields?: { key: string; label: string; options: { value: string; label: string }[] }[];
  bulkActions?: { id: string; label: string; onAction: (ids: string[]) => void }[];
  groupByKey?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  toolbarExtra?: ReactNode;
}

export function ExperienceDataList<T extends { id: string }>({
  listKey,
  columns,
  rows,
  caption,
  emptyMessage = "No records found.",
  filterFields = [],
  bulkActions = [],
  groupByKey,
  className,
  onRowClick,
  toolbarExtra,
}: ExperienceDataListProps<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | undefined>();
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [savedViews, setSavedViews] = useState<XesSavedView[]>(() => readViews(`xes-views-${listKey}`));
  const [activeViewId, setActiveViewId] = useState<string | undefined>();

  const applyView = useCallback((view: XesSavedView) => {
    setFilters(view.filters);
    setSortKey(view.sortKey);
    setSortDir(view.sortDir ?? "asc");
    setActiveViewId(view.id);
  }, []);

  const saveCurrentView = useCallback(
    (label: string) => {
      const view: XesSavedView = {
        id: crypto.randomUUID(),
        label,
        filters,
        sortKey,
        sortDir,
        groupKey: groupByKey,
      };
      const next = [...savedViews, view];
      setSavedViews(next);
      writeViews(`xes-views-${listKey}`, next);
      setActiveViewId(view.id);
    },
    [filters, groupByKey, listKey, savedViews, sortDir, sortKey]
  );

  const filtered = useMemo(() => {
    let result = [...rows];
    for (const [key, val] of Object.entries(filters)) {
      if (!val) continue;
      result = result.filter((row) => String((row as Record<string, unknown>)[key] ?? "") === val);
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        result.sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [columns, filters, rows, sortDir, sortKey]);

  const grouped = useMemo(() => {
    if (!groupByKey) return { "": filtered };
    return filtered.reduce<Record<string, T[]>>((acc, row) => {
      const key = String((row as Record<string, unknown>)[groupByKey] ?? "Other");
      (acc[key] ??= []).push(row);
      return acc;
    }, {});
  }, [filtered, groupByKey]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        {filterFields.map((field) => (
          <label key={field.key} className="text-sm">
            <span className="text-slate-500">{field.label}</span>
            <select
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={filters[field.key] ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, [field.key]: e.target.value }))}
            >
              <option value="">All</option>
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        ))}
        {savedViews.length > 0 && (
          <label className="text-sm">
            <span className="text-slate-500">Saved view</span>
            <select
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={activeViewId ?? ""}
              onChange={(e) => {
                const view = savedViews.find((v) => v.id === e.target.value);
                if (view) applyView(view);
              }}
            >
              <option value="">Custom</option>
              {savedViews.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => {
            const label = prompt("View name");
            if (label?.trim()) saveCurrentView(label.trim());
          }}
        >
          Save view
        </button>
        {toolbarExtra}
      </div>

      {bulkActions.length > 0 && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm">
          <span className="font-medium text-brand-800">{selected.size} selected</span>
          {bulkActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
              onClick={() => action.onAction([...selected])}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={emptyMessage} />
      ) : (
        Object.entries(grouped).map(([group, groupRows]) => (
          <div key={group || "all"} className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            {group && <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500">{group}</div>}
            <table className="min-w-full text-left text-sm">
              {caption && <caption className="sr-only">{caption}</caption>}
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  {bulkActions.length > 0 && (
                    <th scope="col" className="px-4 py-3">
                      <input type="checkbox" aria-label="Select all" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th key={col.key} scope="col" className={cn("px-4 py-3 font-semibold text-slate-600", col.className)}>
                      {col.sortable ? (
                        <button type="button" className="inline-flex items-center gap-1 hover:text-brand-600" onClick={() => toggleSort(col.key)}>
                          {col.header}
                          {sortKey === col.key && <span aria-hidden>{sortDir === "asc" ? "↑" : "↓"}</span>}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupRows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(onRowClick && "cursor-pointer hover:bg-slate-50/80")}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {bulkActions.length > 0 && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label="Select row" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-3 text-slate-700", col.className)}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
