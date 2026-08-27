"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
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

  const schools = useMemo(
    () => [...new Set(people.map((p) => p.school))].sort(),
    [people]
  );

  const counts = useMemo(() => {
    const map = new Map<PersonGroup, number>();
    for (const p of people) map.set(p.group, (map.get(p.group) ?? 0) + 1);
    return map;
  }, [people]);

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

  function exportCsv() {
    const header = [
      "Last name", "First name", "Type", "School", "Grade", "Program",
      "Status", "Category", "Set by hand", "Guardian", "Email", "Phone", "Date of birth",
    ];
    const body = rows.map((p) =>
      [
        p.lastName, p.firstName, p.kind === "student" ? "Student" : "Prospect",
        p.school, p.grade, p.program, p.statusLabel,
        PERSON_GROUP_LABELS[p.group], p.overridden ? "yes" : "", p.guardianName, p.guardianEmail,
        p.guardianPhone, p.dateOfBirth,
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

      <p className="text-sm text-slate-500">
        Showing {rows.length} of {people.length}
        {pending ? " · saving…" : ""}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => (
              <tr key={`${p.kind}-${p.id}`} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={p.href} className="font-medium text-slate-900 hover:text-brand-600">
                    {p.lastName}, {p.firstName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {p.kind === "student" ? "Student" : "Prospect"}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.school}</td>
                <td className="px-4 py-3 text-slate-600">{p.grade ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${GROUP_TONE[p.group]}`}>
                    {p.statusLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.overridden ? p.group : "derived"}
                    onChange={(e) =>
                      reclassify(p, e.target.value as PersonGroup | "derived")
                    }
                    className={`rounded-lg border px-2 py-1 text-xs ${
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
                    <option value="derived">
                      Auto — {PERSON_GROUP_LABELS[p.derivedGroup]}
                    </option>
                    {PERSON_GROUPS.map((g) => (
                      <option key={g} value={g}>{PERSON_GROUP_LABELS[g]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.guardianName ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {p.guardianEmail ?? p.guardianPhone ?? "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
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
