"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PipelineFilters } from "./PipelineFilters";
import {
  applyFilters,
  filtersFromParams,
  type BoardFilters,
  type BoardLead,
} from "@/lib/admissions/board-filters";
import { OLD_STUDENT_LEAD_STAGES } from "@/lib/constants/admissions";

/**
 * THE THREE QUIET COLUMNS, WITH THE BOARD'S OWN SEARCH OVER THEM.
 *
 * Jimmy, 11 October 2026: "also need the quiet student page to have the same
 * filter, sorting and search ability as the current pipeline".
 *
 * THE SAME COMPONENT AND THE SAME PREDICATE, NOT A SECOND SET THAT LOOKS
 * ALIKE. PipelineFilters and applyFilters are imported exactly as the
 * pipeline board imports them, so the option counts, the waiting bands, the
 * URL round-trip and the matching rules cannot drift between the two pages.
 * Writing a second search here is how "Towa" stops finding Julian Oubre Towa
 * on one page and keeps working on the other - see matchesQuery in
 * board-filters.ts for the fortnight that cost.
 *
 * NINETY-SEVEN FAMILIES, which is why it was asked for. Decision Needed,
 * Declined and Alumni together are larger than most of the live pipeline, and
 * a page nobody can search is a page nobody reads.
 *
 * SORTING. The pipeline board has search, campus, waiting and owner and no
 * sort control of its own; within a column it shows the order the query
 * returned. Rather than invent a sort here that the pipeline does not have -
 * which would be a second thing to keep in step - the columns are ordered by
 * how long each family has been waiting, longest first, which is the only
 * question this page exists to answer. Sedona Simeonov, waiting since 25
 * August, is at the top of Decision Needed and stays there.
 *
 * THIS COMPONENT IS CLIENT-SIDE AND THE READ IS NOT. getLeads() still runs on
 * the server, still under row-level security, and hands the rows down. The
 * filtering happens over rows the viewer is already allowed to see; nothing
 * here widens what that is.
 */

/**
 * The lead as a bag of columns.
 *
 * BoardLead is a typed row and the fields read here - lead_stage, created_at,
 * the joined school name - are not all on it, which is how the page that used
 * to live here read them too. Written once, as a function, because `as
 * Record<string, unknown>` on its own does not compile: TypeScript refuses a
 * direct conversion between two types that do not overlap (TS2352, "Index
 * signature for type 'string' is missing in type 'BoardLead'"), and the cast
 * has to go through unknown. Doing that inline at five call sites is five
 * chances to write the short version and fail the build - which is exactly
 * what happened on 11 October.
 */
function row(lead: BoardLead): Record<string, unknown> {
  return lead as unknown as Record<string, unknown>;
}

/** Whole days between a date and now, floored. Null when there is no date. */
function daysSince(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return null;
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  return days < 0 ? 0 : days;
}

function fullName(lead: Record<string, unknown>): string {
  const first = String(lead.first_name ?? "").trim();
  const last = String(lead.last_name ?? "").trim();
  return `${first} ${last}`.trim() || "Unnamed child";
}

function guardianName(lead: Record<string, unknown>): string {
  const first = String(lead.guardian_first_name ?? "").trim();
  const last = String(lead.guardian_last_name ?? "").trim();
  return `${first} ${last}`.trim();
}

export interface QuietStudentsBoardProps {
  leads: readonly BoardLead[];
}

export function QuietStudentsBoard({ leads }: QuietStudentsBoardProps) {
  /*
   * Seeded from the URL so a narrowed page survives a refresh and can be sent
   * to somebody. PipelineFilters writes the query string back as they change;
   * this only reads it once, on mount. Same as the pipeline board.
   */
  const [filters, setFilters] = useState<BoardFilters>(() =>
    filtersFromParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search)
    )
  );

  const visible = useMemo(() => applyFilters(leads, filters), [leads, filters]);

  const byStage = useMemo(() => {
    const map = new Map<string, BoardLead[]>();
    for (const stage of OLD_STUDENT_LEAD_STAGES) map.set(stage.value, []);
    for (const lead of visible) {
      const bucket = map.get(String(row(lead).lead_stage ?? ""));
      if (bucket) bucket.push(lead);
    }
    /* Longest wait first, within every column. A family nobody has answered
       belongs at the top of the list, not wherever the query put them. */
    for (const rows of map.values()) {
      rows.sort((a, b) => {
        const aAt = daysSince(row(a).created_at) ?? -1;
        const bAt = daysSince(row(b).created_at) ?? -1;
        return bAt - aAt;
      });
    }
    return map;
  }, [visible]);

  const shown = visible.length;

  return (
    <>
      <PipelineFilters
        leads={leads}
        filters={filters}
        shownCount={shown}
        onChange={setFilters}
      />

      <p className="text-sm text-slate-500">
        {shown === 0
          ? "Nobody here."
          : `${shown} ${shown === 1 ? "family" : "families"}, at your campus.`}
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {OLD_STUDENT_LEAD_STAGES.map((stage) => {
          const rows = byStage.get(stage.value) ?? [];
          /* Decision Needed is the only column anybody has to act on, so it is
             the only one that carries a colour. */
          const waiting = stage.value === "waitlisted";

          return (
            <section
              key={stage.value}
              className={`rounded-2xl border p-4 ${
                waiting ? "border-orange-300 bg-orange-50/60" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2
                  className={`text-sm font-semibold ${
                    waiting ? "text-orange-900" : "text-slate-900"
                  }`}
                >
                  {stage.label}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    waiting ? "bg-orange-200 text-orange-900" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {rows.length}
                </span>
              </div>

              {waiting && rows.length > 0 && (
                <p className="mt-2 text-xs text-orange-900">
                  {rows.length === 1
                    ? "This family has not been told anything."
                    : "These families have not been told anything."}
                </p>
              )}

              <div className="mt-3 space-y-2">
                {rows.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                    Nobody
                  </p>
                )}

                {rows.map((lead) => {
                  const r = row(lead);
                  const days = daysSince(r.created_at);
                  const guardian = guardianName(r);
                  return (
                    <Link
                      key={String(r.id)}
                      href={`/dashboard/admissions/cases/${String(r.id)}`}
                      className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-400"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{fullName(r)}</p>
                        {days !== null && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                              waiting
                                ? "bg-orange-100 text-orange-900"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {days}d
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {String((r.schools as { name?: string } | null)?.name ?? "—")}
                      </p>
                      {guardian && <p className="mt-1 text-xs text-slate-400">{guardian}</p>}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
