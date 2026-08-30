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
  { key: "name", label: "Name", width: 180 },
  { key: "type", label: "Type", width: 85 },
  { key: "school", label: "Program", width: 170 },
  { key: "grade", label: "Grade", width: 80 },
  { key: "status", label: "Status", width: 135 },
  { key: "inquired", label: "Inquired", width: 110 },
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
// Bumped when the column set changed; stale saved widths for a different
// set of columns produce a layout nobody chose.
const WIDTHS_KEY = "people-directory-column-widths-v2";

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
  const [school, setSchool] = useState("all");
  const [group, setGroup] = useState<"all" | PersonGroup>("all");
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
  // Newest first by default. A list of enquiries whose top row is whoever comes
  // first alphabetically answers a question nobody asked.
  const [sort, setSort] = useState<"name" | "newest" | "oldest">("newest");

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

  // Names only — this drives the filter dropdown. The `schools` prop carries
  // ids, which is what moving somebody between schools needs.
  const schoolNames = useMemo(
    () => [...new Set(people.map((p) => p.school))].sort(),
    [people]
  );

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
    const filtered = people.filter((p) => {
      // Archived records stay out of the way but stay reachable, so a mistaken
      // archive is one click from being undone rather than a support request.
      if (p.archived !== showArchived) return false;
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

    if (sort === "name") return filtered;
    // Rows with no date sink to the bottom either way; "oldest first" should
    // not be led by everyone we know nothing about.
    return [...filtered].sort((a, b) => {
      if (!a.inquiryDate && !b.inquiryDate) return 0;
      if (!a.inquiryDate) return 1;
      if (!b.inquiryDate) return -1;
      return sort === "newest"
        ? b.inquiryDate.localeCompare(a.inquiryDate)
        : a.inquiryDate.localeCompare(b.inquiryDate);
    });
  }, [people, query, school, group, showArchived, sort]);

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
            {p.inquiryDate}
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
      case "inquired": return DATE_SOURCE_LABELS[p.inquiryDateSource];
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
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All schools</option>
          {schoolNames.map((name) => (
            <option key={name} value={name}>{name}</option>
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
                  ) : column.key === "inquired" ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSort((current) =>
                          current === "newest" ? "oldest" : current === "oldest" ? "name" : "newest"
                        )
                      }
                      title="Click to sort: newest, oldest, then back to by name"
                      className="flex items-center gap-1 uppercase hover:text-slate-800"
                    >
                      {column.label}
                      <span className="text-[10px]">
                        {sort === "newest" ? "▼" : sort === "oldest" ? "▲" : "↕"}
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
