"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CONTACT_SOURCE_LABELS,
  DATE_SOURCE_LABELS,
  PERSON_GROUPS,
  PERSON_GROUP_LABELS,
  type DirectoryPerson,
  type PersonGroup,
  type PersonPatch,
  type SchoolOption,
} from "@/lib/people/directory-shared";
import { setPersonGroup } from "@/lib/people/actions";
import { deletePeople, setPeopleArchived, updatePeople } from "@/lib/people/mutations";
import { PersonEditDialog } from "@/components/people/PersonEditDialog";
import { PersonRemoveDialog } from "@/components/people/PersonRemoveDialog";

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
  | "select" | "name" | "type" | "school" | "grade"
  | "status" | "inquired" | "category" | "guardian" | "email" | "phone" | "actions";

/** `fixed` columns carry no resize handle — a 44px checkbox gains nothing. */
const COLUMNS: { key: ColumnKey; label: string; width: number; fixed?: boolean }[] = [
  { key: "select", label: "", width: 44, fixed: true },
  // The sort marker sits inside the header, so a width that fitted the label
  // alone now truncates it — "Grade" became "Gr…". These carry the arrow.
  { key: "name", label: "Name", width: 180 },
  { key: "type", label: "Type", width: 100 },
  { key: "school", label: "Program", width: 170 },
  { key: "grade", label: "Grade", width: 95 },
  { key: "status", label: "Status", width: 140 },
  { key: "inquired", label: "Inquired", width: 135 },
  { key: "category", label: "Category", width: 150 },
  { key: "guardian", label: "Parent / guardian", width: 150 },
  { key: "email", label: "Email", width: 205 },
  { key: "phone", label: "Phone", width: 150 },
  { key: "actions", label: "", width: 150 },
];

const MIN_WIDTH = 64;
/**
 * The floor under the last, unsized column. Without it, widening any other
 * column eats the slack and then crushes the last one to a 1px sliver rather
 * than letting the table overflow — verified, it really does reach 1px.
 * Carrying it in the table's min-width makes the wrapper scroll instead.
 */
const LAST_COLUMN_MIN = 150;
// Bumped when the column set or the default widths change; a stale saved set
// produces a layout nobody chose — v2 widths predate the sort markers and
// truncate "Grade" to "Gr…".
const WIDTHS_KEY = "people-directory-column-widths-v3";

type Widths = Partial<Record<ColumnKey, number>>;

function defaultWidths(): Widths {
  return Object.fromEntries(COLUMNS.map((c) => [c.key, c.width])) as Widths;
}

/**
 * Eleven columns do not fit a laptop, so the table scrolls sideways — and a
 * row's Edit and Delete buttons are useless if you have to scroll to reach
 * them. The checkbox and the actions are pinned to the edges; everything
 * between them moves. Pinned cells need their own background or the scrolling
 * columns show through.
 */
function stickyClass(key: ColumnKey, header: boolean): string {
  const surface = header ? "bg-slate-50" : "bg-white";
  const layer = header ? "z-30" : "z-10";
  if (key === "select") {
    return `sticky left-0 ${layer} ${surface} shadow-[1px_0_0_0_rgb(226_232_240)]`;
  }
  if (key === "actions") {
    return `sticky right-0 ${layer} ${surface} shadow-[-1px_0_0_0_rgb(226_232_240)]`;
  }
  return "";
}

function csvCell(value: string | null): string {
  const v = value ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * ISO in, MM/DD/YY out. Sliced rather than passed through `new Date()`: a
 * date-only string is parsed as UTC and then printed in local time, which west
 * of Greenwich shows every date one day early.
 *
 * The CSV keeps the ISO form — a spreadsheet can read that as a date.
 */
function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!parts) return iso;
  return `${parts[2]}/${parts[3]}/${parts[1].slice(2)}`;
}

/**
 * Grades sort as school years, not as text: without this, 10 lands between 1
 * and 2 and Kindergarten sorts under K somewhere after 9.
 */
function gradeRank(grade: string | null): number | null {
  if (!grade) return null;
  const g = grade.trim().toLowerCase();
  if (/^p(re)?-?\s?k/.test(g)) return -1;
  if (/^k/.test(g)) return 0;
  const n = Number.parseInt(g.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** How each column is filtered. `none` columns carry no control. */
const FILTER_KIND: Record<ColumnKey, "none" | "text" | "select" | "date"> = {
  select: "none",
  name: "text",
  type: "select",
  school: "select",
  grade: "select",
  status: "select",
  inquired: "date",
  category: "select",
  guardian: "text",
  email: "text",
  phone: "text",
  actions: "none",
};

type FilterKey = Exclude<ColumnKey, "select" | "actions">;

const SORTABLE = COLUMNS.filter((c) => FILTER_KIND[c.key] !== "none").map((c) => c.key);

/**
 * The plain text behind a column, which is what both the filter and the sort
 * read. Deriving both from one function is what stops "Program" filtering on
 * the billing entity while the eye is reading the programs the child attends.
 */
function fieldText(key: FilterKey, p: DirectoryPerson): string {
  switch (key) {
    case "name": return `${p.lastName}, ${p.firstName}`;
    case "type": return p.kind === "student" ? "Student" : "Prospect";
    case "school": return p.programs ?? p.school;
    case "grade": return p.grade ?? "";
    case "status": return p.statusLabel;
    case "inquired": return p.inquiryDate ?? "";
    case "category": return PERSON_GROUP_LABELS[p.group];
    case "guardian": return p.guardianName ?? "";
    case "email": return p.guardianEmail ?? "";
    case "phone": return p.guardianPhone ?? "";
  }
}

/** Null means "no value", which sinks to the bottom in both directions. */
function sortValue(key: FilterKey, p: DirectoryPerson): string | number | null {
  if (key === "grade") return gradeRank(p.grade);
  const text = fieldText(key, p);
  return text ? text.toLowerCase() : null;
}

export function PeopleDirectoryTable({
  people: initial,
  schools,
  canManageLifecycle,
}: {
  people: DirectoryPerson[];
  schools: SchoolOption[];
  /** Archive and delete are a stricter role than edit; the server enforces it
      too, but a button that always fails is worse than one that is disabled. */
  canManageLifecycle: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | PersonGroup>("all");
  // One value per column. The toolbar's school picker writes into this same
  // place rather than keeping a second copy — two controls for one filter is
  // how a table ends up disagreeing with its own header.
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  // Held locally so a reclassification shows immediately rather than after a
  // round trip; the server action revalidates the page behind it.
  const [people, setPeople] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // ---- selection -----------------------------------------------------------
  // Keyed "kind:id": a student and a prospect can share an id, and selecting
  // one must never drag the other along.
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState<DirectoryPerson[] | null>(null);
  const [removing, setRemoving] = useState<DirectoryPerson[] | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  // Newest enquiry first by default. A list of enquiries whose top row is
  // whoever comes first alphabetically answers a question nobody asked.
  const [sortKey, setSortKey] = useState<FilterKey>("inquired");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: FilterKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // Dates want the newest first; everything else reads better from A.
    setSortDir(key === "inquired" ? "desc" : "asc");
  }

  function setFilter(key: FilterKey, value: string) {
    setFilters((current) => {
      const next = { ...current };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }

  function clearFilters() {
    setFilters({});
    setDateFrom("");
    setDateTo("");
  }

  const activeFilterCount =
    Object.keys(filters).length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const rowKey = (p: DirectoryPerson) => `${p.kind}:${p.id}`;

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

  const selectedPeople = useMemo(
    () => people.filter((p) => selected.has(`${p.kind}:${p.id}`)),
    [people, selected]
  );

  function toggleRow(person: DirectoryPerson) {
    setSelected((current) => {
      const next = new Set(current);
      const key = `${person.kind}:${person.id}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /** Select-all applies to what is on screen, never to the hidden remainder. */
  function toggleAllVisible(rowsOnScreen: DirectoryPerson[], on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const p of rowsOnScreen) {
        const key = `${p.kind}:${p.id}`;
        if (on) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  const targets = (list: DirectoryPerson[]) => list.map((p) => ({ kind: p.kind, id: p.id }));

  /**
   * Every mutation ends with router.refresh() rather than a local patch. These
   * writes fan out — a parent email lands on families and guardians, an archive
   * changes a status — and reconstructing all of that in the browser is how a
   * table starts disagreeing with the database.
   */
  function finish(result: { ok: boolean; message?: string; error?: string }) {
    if (result.ok) {
      setSelected(new Set());
      setNotice(result.message ?? null);
      setError(null);
      router.refresh();
    }
    return result;
  }

  async function saveEdit(patch: PersonPatch) {
    const list = editing ?? [];
    const result = await updatePeople({ targets: targets(list), patch });
    finish(result);
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  }

  async function archiveSelection(list: DirectoryPerson[], reason: string | null) {
    const result = await setPeopleArchived({ targets: targets(list), archived: true, reason });
    finish(result);
    return result.ok
      ? { ok: true }
      : { ok: false, error: result.error, blocked: result.blocked };
  }

  async function deleteSelection(
    list: DirectoryPerson[],
    confirmationText: string,
    acknowledged: boolean
  ) {
    const result = await deletePeople({ targets: targets(list), confirmationText, acknowledged });
    finish(result);
    return result.ok
      ? { ok: true }
      : { ok: false, error: result.error, blocked: result.blocked };
  }

  function restore(list: DirectoryPerson[]) {
    startTransition(async () => {
      const result = await setPeopleArchived({ targets: targets(list), archived: false });
      if (!result.ok) setError(result.error);
      else finish(result);
    });
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

  /**
   * Names only — this drives the filter dropdown. The `schools` prop carries
   * ids, which is what moving somebody between schools needs.
   *
   * Split on " + " so a dual-enrolled child contributes both of their schools
   * as options rather than one combined option that matches nobody else. The
   * match below is a substring test for the same reason: picking "The Academy
   * Virtual" must still find the child enrolled at HS and Virtual.
   */
  const schoolNames = useMemo(() => {
    const names = new Set<string>();
    for (const p of people) {
      for (const part of (p.programs ?? p.school).split(" + ")) {
        const name = part.trim();
        if (name) names.add(name);
      }
      if (p.school) names.add(p.school);
    }
    return [...names].sort();
  }, [people]);

  /** Distinct values per dropdown column, taken from what is actually on file. */
  const options = useMemo(() => {
    const map = new Map<FilterKey, string[]>();
    const visible = people.filter((p) => p.archived === showArchived);
    for (const key of ["type", "grade", "status", "category"] as FilterKey[]) {
      const values = new Set<string>();
      for (const p of visible) {
        const text = fieldText(key, p);
        if (text) values.add(text);
      }
      map.set(
        key,
        [...values].sort((a, b) =>
          key === "grade"
            ? (gradeRank(a) ?? 99) - (gradeRank(b) ?? 99)
            : a.localeCompare(b)
        )
      );
    }
    map.set("school", schoolNames);
    return map;
  }, [people, showArchived, schoolNames]);

  const archivedCount = useMemo(() => people.filter((p) => p.archived).length, [people]);

  const counts = useMemo(() => {
    const map = new Map<PersonGroup, number>();
    for (const p of people) {
      if (p.archived !== showArchived) continue;
      map.set(p.group, (map.get(p.group) ?? 0) + 1);
    }
    return map;
  }, [people, showArchived]);

  // Counted, not just marked. "Some contacts came from the enquiry" is a note;
  // a number is something you can work through.
  const borrowedContacts = useMemo(
    () => people.filter((p) => p.kind === "student" && p.contactSource === "lead").length,
    [people]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const entries = Object.entries(filters) as [FilterKey, string][];

    const filtered = people.filter((p) => {
      // Archived records stay out of the way but stay reachable, so a mistaken
      // archive is one click from being undone rather than a support request.
      if (p.archived !== showArchived) return false;
      if (group !== "all" && p.group !== group) return false;

      for (const [key, value] of entries) {
        if (!value) continue;
        const text = fieldText(key, p);
        if (FILTER_KIND[key] === "select") {
          // Substring, not equality — see the note on schoolNames.
          if (key === "school") {
            if (!text.includes(value) && p.school !== value) return false;
          } else if (text !== value) {
            return false;
          }
        } else if (!text.toLowerCase().includes(value.trim().toLowerCase())) {
          return false;
        }
      }

      // A row with no date is excluded by any date bound rather than kept: a
      // range asked for is a range, and rows we know nothing about are not in it.
      if (dateFrom && (!p.inquiryDate || p.inquiryDate < dateFrom)) return false;
      if (dateTo && (!p.inquiryDate || p.inquiryDate > dateTo)) return false;

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

    const byName = (a: DirectoryPerson, b: DirectoryPerson) =>
      `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`);

    return [...filtered].sort((a, b) => {
      const av = sortValue(sortKey, a);
      const bv = sortValue(sortKey, b);
      // Rows with nothing in the sorted column sink to the bottom in both
      // directions; "oldest first" should not be led by everyone we know
      // nothing about.
      if (av === null && bv === null) return byName(a, b);
      if (av === null) return 1;
      if (bv === null) return -1;
      const delta =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      if (delta === 0) return byName(a, b);
      return sortDir === "asc" ? delta : -delta;
    });
  }, [people, query, filters, dateFrom, dateTo, group, showArchived, sortKey, sortDir]);

  function cell(key: ColumnKey, p: DirectoryPerson): ReactNode {
    switch (key) {
      case "select":
        return (
          <input
            type="checkbox"
            checked={selected.has(rowKey(p))}
            onChange={() => toggleRow(p)}
            aria-label={`Select ${p.lastName}, ${p.firstName}`}
            className="h-4 w-4 rounded border-slate-300"
          />
        );
      case "actions":
        return (
          <span className="flex gap-1">
            <button
              type="button"
              onClick={() => setEditing([p])}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
            {p.archived ? (
              <button
                type="button"
                onClick={() => restore([p])}
                disabled={!canManageLifecycle}
                title={canManageLifecycle ? undefined : "Requires CEO, Founder or School Leader"}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Restore
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRemoving([p])}
                disabled={!canManageLifecycle}
                title={canManageLifecycle ? undefined : "Requires CEO, Founder or School Leader"}
                className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-40"
              >
                Delete
              </button>
            )}
          </span>
        );
      case "name":
        return (
          <Link href={p.href} className="font-medium text-slate-900 hover:text-brand-600">
            {p.lastName}, {p.firstName}
          </Link>
        );
      case "type":
        return p.kind === "student" ? "Student" : "Prospect";
      case "school":
        // Where the child sits, when we know it; the billing entity otherwise.
        // A dual-enrolled child reads "The Academy HS + The Academy Virtual"
        // on one row rather than appearing twice.
        return p.programs ?? p.school;
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
      case "inquired":
        return p.inquiryDate ? (
          <span className={p.inquiryDateSource === "created" ? "text-slate-400" : undefined}>
            {shortDate(p.inquiryDate)}
          </span>
        ) : (
          "—"
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
      case "school":
        return p.programs ? `${p.programs} · billed by ${p.school}` : p.school;
      case "inquired":
        // The cell is abbreviated to MM/DD/YY, so the full date belongs here
        // alongside what it means.
        return p.inquiryDate
          ? `${p.inquiryDate} — ${DATE_SOURCE_LABELS[p.inquiryDateSource]}`
          : DATE_SOURCE_LABELS[p.inquiryDateSource];
      case "guardian": return p.guardianName ?? CONTACT_SOURCE_LABELS[p.contactSource];
      case "email":
      case "phone":
        return CONTACT_SOURCE_LABELS[p.contactSource];
      default: return undefined;
    }
  }

  /**
   * One control per column, in a second header row. Dropdowns where the values
   * are a known set, free text where they are not, and a pair of date bounds
   * for Inquired — a text box against a date is a way to type 08 and match
   * nothing.
   */
  function filterControl(key: ColumnKey): ReactNode {
    const box =
      "w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px] font-normal normal-case text-slate-700";

    if (FILTER_KIND[key] === "none") {
      return key === "actions" && activeFilterCount > 0 ? (
        <button
          type="button"
          onClick={clearFilters}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-normal normal-case text-slate-600 hover:bg-slate-50"
        >
          Clear filters
        </button>
      ) : null;
    }

    if (key === "inquired") {
      return (
        <span className="flex flex-col gap-1">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="On or after"
            aria-label="Inquired on or after"
            className={box}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="On or before"
            aria-label="Inquired on or before"
            className={box}
          />
        </span>
      );
    }

    const filterKey = key as FilterKey;

    if (FILTER_KIND[key] === "select") {
      return (
        <select
          value={filters[filterKey] ?? ""}
          onChange={(e) => setFilter(filterKey, e.target.value)}
          aria-label={`Filter by ${COLUMNS.find((c) => c.key === key)!.label}`}
          className={box}
        >
          <option value="">All</option>
          {(options.get(filterKey) ?? []).map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        value={filters[filterKey] ?? ""}
        onChange={(e) => setFilter(filterKey, e.target.value)}
        placeholder="Contains…"
        aria-label={`Filter by ${COLUMNS.find((c) => c.key === key)!.label}`}
        className={box}
      />
    );
  }

  function exportCsv() {
    const header = [
      "Last name", "First name", "Type", "School", "Grade", "Program",
      "Status", "Inquired", "Date source", "Category", "Set by hand", "Guardian", "Email", "Phone",
      "Contact source", "Date of birth",
    ];
    const body = rows.map((p) =>
      [
        p.lastName, p.firstName, p.kind === "student" ? "Student" : "Prospect",
        p.school, p.grade, p.program, p.statusLabel,
        p.inquiryDate, p.inquiryDateSource,
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
          value={filters.school ?? ""}
          onChange={(e) => setFilter("school", e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All schools</option>
          {schoolNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`rounded-xl border px-4 py-2 text-sm ${
            showFilters || activeFilterCount > 0
              ? "border-slate-800 bg-slate-800 text-white"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
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
          Everyone {people.filter((p) => p.archived === showArchived).length}
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

      {/* The toolbar is always present once something is selected, and the
          lifecycle buttons disable rather than disappear — a control that
          vanishes teaches nobody why they cannot use it. */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm text-white">
          <span className="font-medium">{selected.size} selected</span>
          <button
            type="button"
            onClick={() => setEditing(selectedPeople)}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
          >
            Edit {selected.size}
          </button>
          {showArchived ? (
            <button
              type="button"
              onClick={() => restore(selectedPeople)}
              disabled={!canManageLifecycle}
              title={canManageLifecycle ? undefined : "Requires CEO, Founder or School Leader"}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 disabled:opacity-40"
            >
              Restore {selected.size}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRemoving(selectedPeople)}
              disabled={!canManageLifecycle}
              title={canManageLifecycle ? undefined : "Requires CEO, Founder or School Leader"}
              className="rounded-lg bg-rose-500/90 px-3 py-1.5 text-xs font-medium hover:bg-rose-500 disabled:opacity-40"
            >
              Archive or delete {selected.size}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-slate-300 underline underline-offset-2 hover:text-white"
          >
            Clear selection
          </button>
        </div>
      )}

      {notice && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
      )}

      <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
        <p>
          Showing {rows.length} of {people.length}
          {pending ? " · saving…" : ""}
        </p>
        <span className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => {
                setShowArchived(e.target.checked);
                setSelected(new Set());
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            Show archived ({archivedCount})
          </label>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-800"
            >
              Clear {activeFilterCount} column {activeFilterCount === 1 ? "filter" : "filters"}
            </button>
          )}
          {customised && (
            <button
              type="button"
              onClick={resetAllColumns}
              className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-800"
            >
              Reset column widths
            </button>
          )}
        </span>
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
                <th
                  key={column.key}
                  className={`relative py-3 ${column.key === "select" ? "px-3" : "px-4"} ${stickyClass(column.key, true)}`}
                >
                  {column.key === "select" ? (
                    <input
                      type="checkbox"
                      aria-label="Select every row shown"
                      checked={rows.length > 0 && rows.every((p) => selected.has(rowKey(p)))}
                      onChange={(e) => toggleAllVisible(rows, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  ) : SORTABLE.includes(column.key) ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key as FilterKey)}
                      title={
                        sortKey === column.key
                          ? `Sorted ${sortDir === "asc" ? "A→Z / oldest first" : "Z→A / newest first"} — click to reverse`
                          : `Sort by ${column.label}`
                      }
                      className="flex w-full items-center gap-1 uppercase hover:text-slate-800"
                    >
                      <span className="truncate">{column.label}</span>
                      {/* The inactive marker is faint rather than absent: a
                          header that only becomes clickable once you have
                          already clicked it teaches nobody it was clickable. */}
                      <span
                        className={`shrink-0 text-[10px] ${
                          sortKey === column.key ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        {sortKey === column.key ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  ) : (
                    <span className="block truncate">{column.label}</span>
                  )}
                  {index < COLUMNS.length - 1 && !column.fixed && (
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
            {showFilters && (
              <tr className="border-t border-slate-200">
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={`pb-2 pt-0 align-top ${
                      column.key === "select" ? "px-2" : "px-3"
                    } ${stickyClass(column.key, true)}`}
                  >
                    {filterControl(column.key)}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr key={`${p.kind}-${p.id}`} className="hover:bg-slate-50">
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    /* truncate, not wrap: a narrowed column should clip its
                       text, not turn every row into three lines. */
                    className={`truncate py-3 ${column.key === "select" ? "px-3" : "px-4"} ${
                      column.key === "name" ? "" : "text-slate-600"
                    } ${stickyClass(column.key, false)}`}
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

      {editing && (
        <PersonEditDialog
          people={editing}
          schools={schools}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}

      {removing && (
        <PersonRemoveDialog
          people={removing}
          onClose={() => setRemoving(null)}
          onArchive={(reason) => archiveSelection(removing, reason)}
          onDelete={(token, acknowledged) => deleteSelection(removing, token, acknowledged)}
        />
      )}
    </div>
  );
}
