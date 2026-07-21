"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { CalendarEventActions } from "@/components/calendar/CalendarEventActions";
import type { CalendarOccurrence, CalendarResourceRow, CalendarView } from "@/lib/calendar/types";

const VIEWS: Array<{ value: CalendarView; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "agenda", label: "Agenda" },
];

const TYPE_COLORS: Record<string, string> = {
  class: "bg-sky-100 text-sky-800 border-sky-200",
  meeting: "bg-indigo-100 text-indigo-800 border-indigo-200",
  parent_conference: "bg-violet-100 text-violet-800 border-violet-200",
  iep: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  assessment: "bg-amber-100 text-amber-800 border-amber-200",
  school_event: "bg-emerald-100 text-emerald-800 border-emerald-200",
  holiday: "bg-rose-100 text-rose-800 border-rose-200",
  staff_meeting: "bg-slate-100 text-slate-800 border-slate-200",
  training: "bg-teal-100 text-teal-800 border-teal-200",
  reminder: "bg-orange-100 text-orange-800 border-orange-200",
  workflow_scheduled: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

interface CalendarDashboardProps {
  occurrences: CalendarOccurrence[];
  view: CalendarView;
  anchorDate: string;
  canEdit: boolean;
  studentId?: string;
  familyId?: string;
  teacherId?: string;
  resourceId?: string;
  resources: CalendarResourceRow[];
}

function formatType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimeRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleTimeString(undefined, opts)} – ${end.toLocaleTimeString(undefined, opts)}`;
}

function shiftDate(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function monthLabel(isoDate: string) {
  return new Date(`${isoDate}T12:00:00.000Z`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CalendarDashboard({
  occurrences,
  view,
  anchorDate,
  canEdit,
  studentId,
  familyId,
  teacherId,
  resourceId,
  resources,
}: CalendarDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function pushParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.push(`/dashboard/calendar?${params.toString()}`);
    });
  }

  const dayStep = view === "month" ? 30 : view === "week" ? 7 : 1;

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarOccurrence[]>();
    for (const occ of occurrences) {
      const key = occ.occurrenceStartsAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(occ);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [occurrences]);

  const monthCells = useMemo(() => {
    if (view !== "month") return [];
    const anchor = new Date(`${anchorDate}T12:00:00.000Z`);
    const first = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
    const startPad = first.getUTCDay();
    const daysInMonth = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)
    ).getUTCDate();
    const cells: Array<{ date: string; inMonth: boolean; items: CalendarOccurrence[] }> = [];
    for (let i = 0; i < startPad; i++) {
      const d = new Date(first);
      d.setUTCDate(d.getUTCDate() - (startPad - i));
      cells.push({ date: d.toISOString().slice(0, 10), inMonth: false, items: [] });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), day))
        .toISOString()
        .slice(0, 10);
      cells.push({
        date,
        inMonth: true,
        items: occurrences.filter((o) => o.occurrenceStartsAt.startsWith(date)),
      });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1]!;
      const d = new Date(`${last.date}T12:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      cells.push({ date: d.toISOString().slice(0, 10), inMonth: false, items: [] });
    }
    return cells;
  }, [anchorDate, occurrences, view]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {VIEWS.map((item) => {
            const active = view === item.value;
            return (
              <button
                key={item.value}
                type="button"
                disabled={pending}
                onClick={() => pushParams({ view: item.value })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => pushParams({ date: shiftDate(anchorDate, -dayStep) })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => pushParams({ date: new Date().toISOString().slice(0, 10) })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => pushParams({ date: shiftDate(anchorDate, dayStep) })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Next
          </button>
          <span className="text-sm font-medium text-slate-700">{monthLabel(anchorDate)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {studentId ? (
          <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-800">
            Student filter
            <button type="button" className="ml-2 underline" onClick={() => pushParams({ studentId: null })}>
              clear
            </button>
          </span>
        ) : null}
        {familyId ? (
          <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-800">
            Family filter
            <button type="button" className="ml-2 underline" onClick={() => pushParams({ familyId: null })}>
              clear
            </button>
          </span>
        ) : null}
        {teacherId ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
            Teacher filter
            <button type="button" className="ml-2 underline" onClick={() => pushParams({ teacherId: null })}>
              clear
            </button>
          </span>
        ) : null}
        {resourceId ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
            Resource filter
            <button type="button" className="ml-2 underline" onClick={() => pushParams({ resourceId: null })}>
              clear
            </button>
          </span>
        ) : null}
        {resources.length > 0 ? (
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
            value={resourceId ?? ""}
            onChange={(e) => pushParams({ resourceId: e.target.value || null })}
          >
            <option value="">All resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.resource_type})
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <p className="text-sm text-slate-500">
        {occurrences.length} event{occurrences.length === 1 ? "" : "s"}
        {pending ? " · updating…" : ""}
        {canEdit ? " · conflict checks run on create/update" : ""}
      </p>

      {view === "month" ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-1 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((cell) => (
              <button
                key={cell.date}
                type="button"
                onClick={() => pushParams({ view: "day", date: cell.date })}
                className={`min-h-24 border-b border-r border-slate-100 p-1.5 text-left align-top ${
                  cell.inMonth ? "bg-white" : "bg-slate-50 text-slate-400"
                }`}
              >
                <div className="text-xs font-medium">{Number(cell.date.slice(8))}</div>
                <ul className="mt-1 space-y-0.5">
                  {cell.items.slice(0, 3).map((item) => (
                    <li
                      key={`${item.id}:${item.occurrenceStartsAt}`}
                      className="truncate rounded px-1 text-[10px] leading-4 text-slate-700"
                      style={{ backgroundColor: item.color ? `${item.color}33` : "#e2e8f0" }}
                    >
                      {item.title}
                    </li>
                  ))}
                  {cell.items.length > 3 ? (
                    <li className="text-[10px] text-slate-500">+{cell.items.length - 3} more</li>
                  ) : null}
                </ul>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {byDay.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No events in this range.{" "}
              {canEdit ? (
                <Link href={`/dashboard/calendar?view=${view}&date=${anchorDate}&create=1`} className="text-brand-700 underline">
                  Create one
                </Link>
              ) : null}
            </div>
          ) : (
            byDay.map(([date, items]) => (
              <section key={date} className="rounded-xl border border-slate-200 bg-white">
                <header className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                  {new Date(`${date}T12:00:00.000Z`).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </header>
                <ul className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <li
                      key={`${item.id}:${item.occurrenceStartsAt}`}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded border px-2 py-0.5 text-xs font-medium ${
                              TYPE_COLORS[item.event_type] ?? TYPE_COLORS.meeting
                            }`}
                          >
                            {formatType(item.event_type)}
                          </span>
                          {item.isRecurringInstance ? (
                            <span className="text-xs text-slate-500">Recurring</span>
                          ) : null}
                          {item.metadata &&
                          typeof item.metadata === "object" &&
                          (item.metadata as { source?: string }).source ===
                            "instructional_sessions" ? (
                            <span className="text-xs text-slate-500">SIS class</span>
                          ) : null}
                        </div>
                        <h3 className="truncate text-sm font-semibold text-slate-900">{item.title}</h3>
                        {item.description ? (
                          <p className="line-clamp-2 text-sm text-slate-600">{item.description}</p>
                        ) : null}
                        {item.meet_url ? (
                          <a
                            href={item.meet_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-brand-700 underline"
                          >
                            Join meeting
                          </a>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 text-right text-sm text-slate-600">
                        <div>{formatTimeRange(item.occurrenceStartsAt, item.occurrenceEndsAt)}</div>
                        <div className="text-xs text-slate-400">{item.timezone}</div>
                        {canEdit ? (
                          <CalendarEventActions eventId={item.id} title={item.title} />
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
