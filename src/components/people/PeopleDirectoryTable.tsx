"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  CONTACT_SOURCE_LABELS,
  PERSON_GROUPS,
  PERSON_GROUP_LABELS,
  type DirectoryPerson,
  type PersonGroup,
} from "@/lib/people/directory-shared";
import { setPersonGroup } from "@/lib/people/actions";

/**
 * Every child in one table — enrolled, in the pipeline, alumni, or never
 * enrolled — with the source table reduced to a column.
 *
 * Filtering happens in the browser: the whole network is a few hundred rows,
 * far below the point where paging earns its complexity, and instant filtering
 * is worth more than saving a few kilobytes.
 */

const GROUP_ORDER: PersonGroup[] = [
  "enrolled",
  "pipeline",
  "accepted",
  "alumni",
  "not_enrolled",
  "other",
];

const GROUP_TONE: Record<PersonGroup, string> = {
  enrolled: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  pipeline: "bg-sky-50 text-sky-700 ring-sky-600/20",
  accepted: "bg-violet-50 text-violet-700 ring-violet-600/20",
  alumni: "bg-slate-100 text-slate-600 ring-slate-500/20",
  not_enrolled: "bg-rose-50 text-rose-700 ring-rose-600/20",
  other: "bg-amber-50 text-amber-800 ring-amber-600/20",
};

/**
 * One definition per column so the header and the body cannot drift apart —
 * the widths are applied to a <colgroup>, and a resized header would otherwise
 * have to be kept in step with hand-written cells by hand.
 *
 * The last column is deliberately left without a width: under `table-fixed` an
 * unsized column absorbs whatever space is left, so the table fills the page at
 * any window size instead of stopping short with a band of white beside it.
 */
type ColumnKey =
  | "name" | "type" | "school" | "grade"
  | "status" | "category" | "guardian" | "email" | "phone";

const COLUMNS: { key: ColumnKey; label: string; width: number }[] = [
  { key: "name", label: "Name", width: 200 },
  { key: "type", label: "Type", width: 90 },
  { key: "school", label: "School", width: 165 },
  { key: "grade", label: "Grade", width: 85 },
  { key: "status", label: "Status", width: 145 },
  { key: "category", label: "Category", width: 160 },
  { key: "guardian", label: "Parent / guardian", width: 175 },
  { key: "email", label: "Email", width: 235 },
  { key: "phone", label: "Phone", width: 150 },
];

const MIN_WIDTH = 64;
/**
 * The floor under the last, unsized column. Without it, widening any other
 * column eats the slack and then crushes the last one to a 1px sliver rather
 * than letting the table overflow — verified, it really does reach 1px.
 * Carrying it in the table's min-width makes the wrapper scroll instead.
 */
const LAST_COLUMN_MIN = 130;
const WIDTHS_KEY = "people-directory-column-widths";

type Widths = Partial<Record<ColumnKey, number>>;

function defaultWidths(): Widths {
  return Object.fromEntries(COLUMNS.map((c) => [c.key, c.width])) as Widths;
}

function csvCell(value: string | null): string {
  const v = value ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function PeopleDirectoryTable({ people: initial }: { people: DirectoryPerson[] }) {
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState("all");
  const [group, setGroup] = useState<"all" | PersonGroup>("all");
  // Held locally so a reclassification shows immediately rather than after a
  // round trip; the server action revalidates the page behind it.
  const [people, setPeople] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ---- column widths -------------------------------------------------------
  // Starts at the defaults on both server and client so the first paint matches
  // the server's HTML; the saved widths are read after mount, where a mismatch
  // is no longer a hydration error.
  const [widths, setWidths] = useState<Widths>(defaultWidths);
  const [customised, setCustomised] = useState(false);
  const drag = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(WIDTHS_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Widths;
      const clean: Widths = {};
      for (const column of COLUMNS) {
        const value = parsed[column.key];
        if (typeof value === "number" && Number.isFinite(value)) {
          clean[column.key] = Math.max(MIN_WIDTH, Math.round(value));
        }
      }
      if (Object.keys(clean).length) {
        setWidths({ ...defaultWidths(), ...clean });
        setCustomised(true);
      }
    } catch {
      // A blocked or corrupt store is not worth failing the page over — the
      // defaults are perfectly usable.
    }
  }, []);

  const persist = useCallback((next: Widths) => {
    try {
      window.localStorage.setItem(WIDTHS_KEY, JSON.stringify(next));
    } catch {
      /* same reasoning as above */
    }
  }, []);

  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, key: ColumnKey) => {
      event.preventDefault();
      event.stopPropagation();
      // Pointer capture keeps the drag alive when the cursor outruns the 6px
      // handle, which it always does.
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = {
        key,
        startX: event.clientX,
        startWidth: widths[key] ?? COLUMNS.find((c) => c.key === key)!.width,
      };
    },
    [widths]
  );

  const onResizeMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    const next = Math.max(MIN_WIDTH, current.startWidth + (event.clientX - current.startX));
    setWidths((w) => ({ ...w, [current.key]: next }));
  }, []);

  const endResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current) return;
      drag.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      setWidths((w) => {
        persist(w);
        return w;
      });
      setCustomised(true);
    },
    [persist]
  );

  function resetColumn(key: ColumnKey) {
    const fallback = COLUMNS.find((c) => c.key === key)!.width;
    setWidths((w) => {
      const next = { ...w, [key]: fallback };
      persist(next);
      return next;
    });
  }

  function resetAllColumns() {
    const next = defaultWidths();
    setWidths(next);
    persist(next);
    setCustomised(false);
  }

  // ---- classification ------------------------------------------------------

  function reclassify(person: DirectoryPerson, next: PersonGroup | "derived") {
    const target = next === "derived" ? person.derivedGroup : next;
    setPeople((rows) =>
      rows.map((r) =>
        r.id === person.id && r.kind === person.kind
          ? { ...r, group: target, overridden: next !== "derived" && target !== r.derivedGroup }
          : r
      )
    );
    startTransition(async () => {
      const result = await setPersonGroup({
        kind: person.kind,
        personId: person.id,
        group: next === "derived" ? null : next,
      });
      if (!result.ok) {
        setError(result.error);
        setPeople(initial); // put it back rather than show a change that did not save
      } else {
        setError(null);
      }
    });
  }

  // Every sized column plus the floor under the unsized one. While the window
  // is wider than this the last column simply takes the slack; past it the
  // wrapper scrolls sideways.
  const minTableWidth = useMemo(
    () =>
      COLUMNS.slice(0, -1).reduce(
        (total, column) => total + (widths[column.key] ?? column.width),
        LAST_COLUMN_MIN
      ),
    [widths]
  );

  const schools = useMemo(
    () => [...new Set(people.map((p) => p.school))].sort(),
    [people]
  );

  const counts = useMemo(() => {
    const map = new Map<PersonGroup, number>();
    for (const p of people) map.set(p.group, (map.get(p.group) ?? 0) + 1);
    return map;
  }, [people]);

  // Counted, not just marked. "Some contacts came from the enquiry" is a note;
  // a number is something you can work through.
  const borrowedContacts = useMemo(
    () => people.filter((p) => p.kind === "student" && p.contactSource === "lead").length,
    [people]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (school !== "all" && p.school !== school) return false;
      if (group !== "all" && p.group !== group) return false;
      if (!q) return true;
      return [
        p.firstName,
        p.lastName,
        p.guardianName,
        p.guardianEmail,
        p.guardianPhone,
        p.statusLabel,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [people, query, school, group]);

  function cell(key: ColumnKey, p: DirectoryPerson): ReactNode {
    switch (key) {
      case "name":
        return (
          <Link href={p.href} className="font-medium text-slate-900 hover:text-brand-600">
            {p.lastName}, {p.firstName}
          </Link>
        );
      case "type":
        return p.kind === "student" ? "Student" : "Prospect";
      case "school":
        return p.school;
      case "grade":
        return p.grade ?? "—";
      case "status":
        return (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${GROUP_TONE[p.group]}`}
          >
            {p.statusLabel}
          </span>
        );
      case "category":
        return (
          <select
            value={p.overridden ? p.group : "derived"}
            onChange={(e) => reclassify(p, e.target.value as PersonGroup | "derived")}
            className={`w-full rounded-lg border px-2 py-1 text-xs ${
              p.overridden
                ? "border-slate-400 bg-white font-medium text-slate-900"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
            title={
              p.overridden
                ? `Set by hand. Data implies ${PERSON_GROUP_LABELS[p.derivedGroup]}.`
                : "Derived from status"
            }
          >
            <option value="derived">Auto — {PERSON_GROUP_LABELS[p.derivedGroup]}</option>
            {PERSON_GROUPS.map((g) => (
              <option key={g} value={g}>{PERSON_GROUP_LABELS[g]}</option>
            ))}
          </select>
        );
      case "guardian":
        return p.guardianName ?? "—";
      case "email":
        return p.guardianEmail ? (
          <span className="inline-flex items-center gap-1.5">
            {/* Contact borrowed from the admissions enquiry is marked, so a
                value that is not yet on the family record cannot be mistaken
                for one that is. */}
            {p.contactSource === "lead" && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            )}
            <a
              href={`mailto:${p.guardianEmail}`}
              className="truncate hover:text-brand-600 hover:underline"
            >
              {p.guardianEmail}
            </a>
          </span>
        ) : (
          "—"
        );
      case "phone":
        return p.guardianPhone ? (
          <a href={`tel:${p.guardianPhone}`} className="hover:text-brand-600 hover:underline">
            {p.guardianPhone}
          </a>
        ) : (
          "—"
        );
    }
  }

  /**
   * A narrowed column clips; hovering should still show the whole value. Only
   * the plain-text columns get one — the chip and the dropdown carry their own.
   */
  function cellTitle(key: ColumnKey, p: DirectoryPerson): string | undefined {
    switch (key) {
      case "name": return `${p.lastName}, ${p.firstName}`;
      case "school": return p.school;
      case "guardian": return p.guardianName ?? CONTACT_SOURCE_LABELS[p.contactSource];
      case "email":
      case "phone":
        return CONTACT_SOURCE_LABELS[p.contactSource];
      default: return undefined;
    }
  }

  function exportCsv() {
    const header = [
      "Last name", "First name", "Type", "School", "Grade", "Program",
      "Status", "Category", "Set by hand", "Guardian", "Email", "Phone",
      "Contact source", "Date of birth",
    ];
    const body = rows.map((p) =>
      [
        p.lastName, p.firstName, p.kind === "student" ? "Student" : "Prospect",
        p.school, p.grade, p.program, p.statusLabel,
        PERSON_GROUP_LABELS[p.group], p.overridden ? "yes" : "", p.guardianName, p.guardianEmail,
        p.guardianPhone, p.contactSource, p.dateOfBirth,
      ].map((c) => csvCell(c == null ? null : String(c))).join(",")
    );
    const blob = new Blob([[header.join(","), ...body].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `people-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, guardian, email, phone…"
          className="min-w-64 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All schools</option>
          {schools.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>

      {/* Category chips double as the count summary — one glance answers
          "how many are enrolled" without a separate metrics row. */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGroup("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${
            group === "all" ? "bg-slate-800 text-white ring-slate-800" : "bg-white text-slate-600 ring-slate-300"
          }`}
        >
          Everyone {people.length}
        </button>
        {GROUP_ORDER.filter((g) => counts.get(g)).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${
              group === g ? "bg-slate-800 text-white ring-slate-800" : GROUP_TONE[g]
            }`}
          >
            {PERSON_GROUP_LABELS[g]} {counts.get(g)}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      )}

      {borrowedContacts > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <span>
            {borrowedContacts} enrolled {borrowedContacts === 1 ? "student is" : "students are"} showing
            a parent contact taken from their admissions enquiry. It is not on their family
            record yet, so nothing that reads the family — billing, portal invitations,
            mail merges — can see it.
          </span>
        </p>
      )}

      <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
        <p>
          Showing {rows.length} of {people.length}
          {pending ? " · saving…" : ""}
        </p>
        {customised && (
          <button
            type="button"
            onClick={resetAllColumns}
            className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-800"
          >
            Reset column widths
          </button>
        )}
      </div>

      {/* The header sticks: several hundred rows scroll past, and a column of
          bare status chips means nothing once "Status" has scrolled off. */}
      <div className="max-h-[calc(100vh-19rem)] overflow-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full table-fixed text-sm" style={{ minWidth: minTableWidth }}>
          {/* Every column but the last is sized here; the last takes the slack. */}
          <colgroup>
            {COLUMNS.map((column, index) =>
              index === COLUMNS.length - 1 ? (
                <col key={column.key} />
              ) : (
                <col key={column.key} style={{ width: widths[column.key] }} />
              )
            )}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500 shadow-[0_1px_0_0_rgb(226_232_240)]">
            <tr>
              {COLUMNS.map((column, index) => (
                <th key={column.key} className="relative px-4 py-3">
                  <span className="block truncate">{column.label}</span>
                  {index < COLUMNS.length - 1 && (
                    /* Sits astride the column edge and is taller than the
                       header so it stays grabbable; the visible rule only
                       appears on hover, so the header stays quiet at rest. */
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${column.label} column`}
                      onPointerDown={(e) => startResize(e, column.key)}
                      onPointerMove={onResizeMove}
                      onPointerUp={endResize}
                      onPointerCancel={endResize}
                      onDoubleClick={() => resetColumn(column.key)}
                      title="Drag to resize · double-click to reset"
                      className="group absolute top-0 -right-1 z-20 flex h-full w-2 cursor-col-resize touch-none items-stretch justify-center"
                    >
                      <span className="w-px bg-transparent transition-colors group-hover:bg-brand-500" />
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr key={`${p.kind}-${p.id}`} className="hover:bg-slate-50">
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    /* truncate, not wrap: a narrowed column should clip its
                       text, not turn every row into three lines. */
                    className={`truncate px-4 py-3 ${
                      column.key === "name" ? "" : "text-slate-600"
                    }`}
                    title={cellTitle(column.key, p)}
                  >
                    {cell(column.key, p)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-500">
                  Nobody matches those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
