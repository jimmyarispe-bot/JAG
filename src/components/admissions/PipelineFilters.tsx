"use client";

import { useEffect, useId, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { programLabel } from "@/lib/constants/programs";
import {
  // The SAME predicate the board filters with, so an option's count can never
  // disagree with what the board shows after you pick it.
  matchesFilters as matches,
  UNASSIGNED,
  WAITING_BANDS,
  activeFilterCount,
  deriveOptions,
  filtersToParams,
  type BoardFilters,
  type BoardLead,
} from "@/lib/admissions/board-filters";

/**
 * Four ways to make the board smaller.
 *
 * 289 leads across nineteen columns and four campuses. A school leader looking
 * for their own families reads all of it.
 *
 * EVERY OPTION COMES OUT OF THE ROWS ON SCREEN
 *
 * Campus, programme and owner are derived from the leads themselves — see
 * deriveOptions. A dropdown that offers a campus with nobody in it, or a
 * programme nobody is enrolled in, promises a result and returns an empty
 * board. "Unassigned" appears only when some lead actually has no owner, so
 * even that is an answer about the data rather than a guess at it.
 *
 * The count next to each option is the number of families that choice would
 * leave, computed against the OTHER filters currently set — so "The Academy GA
 * (12)" means twelve after everything else you have already chosen, not twelve
 * in the whole network. A count that ignores the rest of the form is a number
 * that lies by a little, every time.
 */

export interface PipelineFiltersProps {
  leads: readonly BoardLead[];
  filters: BoardFilters;
  /** Resolved names for assigned_to_user_id, where known. */
  ownerNames?: Readonly<Record<string, string>>;
  /** How many leads survive the current filters — shown next to the total. */
  shownCount: number;
  onChange: (next: BoardFilters) => void;
}

export function PipelineFilters({
  leads,
  filters,
  ownerNames = {},
  shownCount,
  onChange,
}: PipelineFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campusId = useId();
  const waitingId = useId();
  const programId = useId();
  const ownerId = useId();

  const options = useMemo(() => deriveOptions(leads), [leads]);
  const active = activeFilterCount(filters);

  /**
   * Keep the URL in step, so a narrowed board can be sent to somebody.
   *
   * replace, not push: a filter change is not a place you want the back button
   * to walk through one dropdown at a time. scroll: false because the board is
   * a wide horizontal surface and jumping to the top on every keystroke loses
   * the column somebody was reading.
   */
  useEffect(() => {
    const next = filtersToParams(filters);
    // Preserve anything else already in the URL — ?view=pipeline above all,
    // which is what put the user on this board in the first place.
    for (const [key, value] of searchParams.entries()) {
      if (!["campus", "program", "owner", "waiting"].includes(key)) {
        next.set(key, value);
      }
    }
    const query = next.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
    // searchParams is deliberately not a dependency: it changes as a RESULT of
    // this effect, and including it re-runs the effect on its own output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, router]);

  /** How many rows a candidate value would leave, given everything else set. */
  function countWith(patch: Partial<BoardFilters>): number {
    const candidate = { ...filters, ...patch };
    let n = 0;
    for (const lead of leads) {
      if (matches(lead, candidate)) n += 1;
    }
    return n;
  }

  const select =
    "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800";
  const label = "block text-xs font-medium text-slate-600";

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={campusId} className={label}>
            Campus
          </label>
          <select
            id={campusId}
            value={filters.campus}
            onChange={(e) => onChange({ ...filters, campus: e.target.value })}
            className={`mt-1 ${select}`}
          >
            <option value="">All campuses ({countWith({ campus: "" })})</option>
            {options.campuses.map((name) => (
              <option key={name} value={name}>
                {name} ({countWith({ campus: name })})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={waitingId} className={label}>
            Waiting
          </label>
          <select
            id={waitingId}
            value={String(filters.waitingAtLeast)}
            onChange={(e) =>
              onChange({ ...filters, waitingAtLeast: Number(e.target.value) || 0 })
            }
            className={`mt-1 ${select}`}
          >
            {WAITING_BANDS.map((band) => (
              <option key={band.days} value={band.days}>
                {band.label} ({countWith({ waitingAtLeast: band.days })})
              </option>
            ))}
          </select>
        </div>

        {options.programs.length > 0 && (
          <div>
            <label htmlFor={programId} className={label}>
              Programme
            </label>
            <select
              id={programId}
              value={filters.program}
              onChange={(e) => onChange({ ...filters, program: e.target.value })}
              className={`mt-1 ${select}`}
            >
              <option value="">All programmes ({countWith({ program: "" })})</option>
              {options.programs.map((value) => (
                <option key={value} value={value}>
                  {programLabel(value)} ({countWith({ program: value })})
                </option>
              ))}
            </select>
          </div>
        )}

        {/*
          * Only rendered when ownership is a real distinction in the data. If
          * nothing is assigned to anybody, an Owner dropdown is a control that
          * can only ever say "everyone" — furniture that implies a feature.
          */}
        {(options.owners.length > 0 || options.hasUnassigned) && (
          <div>
            <label htmlFor={ownerId} className={label}>
              Owner
            </label>
            <select
              id={ownerId}
              value={filters.owner}
              onChange={(e) => onChange({ ...filters, owner: e.target.value })}
              className={`mt-1 ${select}`}
            >
              <option value="">Anyone ({countWith({ owner: "" })})</option>
              {options.owners.map((id) => (
                <option key={id} value={id}>
                  {ownerNames[id] ?? "Assigned"} ({countWith({ owner: id })})
                </option>
              ))}
              {options.hasUnassigned && (
                <option value={UNASSIGNED}>
                  Unassigned ({countWith({ owner: UNASSIGNED })})
                </option>
              )}
            </select>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-slate-600">
            {/* The denominator matters. "12 families" alone hides that 277 are
                being withheld by a dropdown somebody forgot they set. */}
            Showing <strong className="text-slate-900">{shownCount}</strong> of{" "}
            {leads.length}
          </span>
          {active > 0 && (
            <button
              type="button"
              onClick={() =>
                onChange({ campus: "", waitingAtLeast: 0, program: "", owner: "" })
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Clear {active} filter{active === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>

      {shownCount === 0 && (
        <p className="mt-3 text-sm text-amber-800">
          No families match these filters. The board is empty because of the
          controls above, not because there is nobody in the pipeline.
        </p>
      )}
    </div>
  );
}
