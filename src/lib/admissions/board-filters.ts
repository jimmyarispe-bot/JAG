/**
 * Narrowing the pipeline board.
 *
 * The board shows every lead in the network — 289 of them across four campuses
 * — in nineteen columns. A school leader looking for their own families, or for
 * whoever has been waiting longest, has to read all of it.
 *
 * Four filters, asked for on 15 September 2026: campus, how long they have been
 * waiting, program, and who owns the lead.
 *
 * OPTIONS ARE DERIVED FROM THE LEADS ON SCREEN, NOT HARDCODED
 *
 * A dropdown offering "The Academy NJ" after NJ closed, or a program nobody
 * is enrolled in, is a filter that promises a result and returns an empty
 * board. Every option here is read out of the rows actually loaded, so the list
 * shrinks as reality does and a choice always matches at least one family.
 *
 * The one exception is the waiting bands, which are thresholds rather than
 * values, and "Unassigned", which is a real answer about the data rather than
 * a value in it.
 *
 * Client-safe by construction: no server imports, no Supabase. Pure functions
 * over rows the board already has.
 */

import type { AdmissionLead } from "@/lib/admissions/queries";

/** The lead as the board sees it, plus the assignment column the query already returns. */
export type BoardLead = AdmissionLead & {
  /** Present in the row — queries.ts selects "*" — but absent from AdmissionLead. */
  assigned_to_user_id?: string | null;
};

export interface BoardFilters {
  /**
   * Free text, matched against the child's and the guardian's names and the
   * guardian's email.
   *
   * WHY THIS EXISTS, AND WHY IT MATCHES ANYWHERE IN THE FIELD
   *
   * 15 September 2026: a School Leader could not find Julian Oubre Towa. He was
   * in JAG the whole time — a lead on The Academy Virtual, at Shadow Days
   * Scheduled, sitting there since 25 August. Two things hid him. There was no
   * search at all, and his surname is stored as "Oubre Towa", two words in one
   * field, so anyone typing "Towa" against a match-from-the-start search finds
   * nothing.
   *
   * So: substring, case-insensitive, and every term has to appear SOMEWHERE in
   * the row rather than all of them in one field. "julian towa" finds him even
   * though no single field contains that phrase. A staff member should not have
   * to know how a name was typed in to find a child.
   */
  q: string;
  /** School name exactly as it appears on the card, or "" for every campus. */
  campus: string;
  /** Minimum days in the current stage. 0 means no lower bound. */
  waitingAtLeast: number;
  /** Program value, or "" for all. */
  program: string;
  /** A user id, the literal "unassigned", or "" for anyone. */
  owner: string;
}

export const NO_FILTERS: BoardFilters = {
  q: "",
  campus: "",
  waitingAtLeast: 0,
  program: "",
  owner: "",
};

export const UNASSIGNED = "unassigned" as const;

/**
 * The waiting bands.
 *
 * Thresholds, not buckets: "over 14 days" includes everyone over 30. A family
 * who has waited two months belongs in every answer to "who has been waiting a
 * while", and bucketing them out of the 14-day view is how the longest waits
 * get missed.
 */
export const WAITING_BANDS: ReadonlyArray<{ days: number; label: string }> = [
  { days: 0, label: "Any wait" },
  { days: 7, label: "7+ days" },
  { days: 14, label: "14+ days" },
  { days: 30, label: "30+ days" },
  { days: 60, label: "60+ days" },
];

/** Days in the current stage. Mirrors daysInCurrentStage in workflow.ts. */
export function daysWaiting(lead: BoardLead, now: number = Date.now()): number {
  const anchor = lead.stage_entered_at ?? lead.created_at;
  if (!anchor) return 0;
  const started = new Date(anchor).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((now - started) / 86_400_000));
}

/**
 * Everything about a lead that a person might type when looking for them.
 *
 * The child's names first, because that is what is searched for; the guardian
 * after, because "the Oubre family" and a parent's email address are both real
 * ways staff look someone up.
 */
function searchableText(lead: BoardLead): string {
  return [
    lead.first_name,
    lead.last_name,
    lead.preferred_name,
    lead.guardian_first_name,
    lead.guardian_last_name,
    lead.guardian_email,
    lead.guardian_phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Every term must appear somewhere in the row — not all in one field.
 *
 * "julian towa" has to find a child whose first_name is "Julian" and whose
 * last_name is "Oubre Towa". Requiring the whole phrase in a single column is
 * exactly the rule that hid him.
 */
export function matchesQuery(lead: BoardLead, query: string): boolean {
  // Tolerates undefined deliberately. A BoardFilters built before `q` existed —
  // a stale bookmark, an older caller, a hand-made object in a test — must not
  // throw and blank the entire board over one absent string. The type says
  // string; reality has already handed this codebase five nulls that the types
  // swore were impossible.
  const terms = (query ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = searchableText(lead);
  return terms.every((term) => haystack.includes(term));
}

function campusOf(lead: BoardLead): string {
  const rel = lead.schools as { name?: string } | { name?: string }[] | null | undefined;
  const name = Array.isArray(rel) ? rel[0]?.name : rel?.name;
  return (name ?? "").trim();
}

export interface BoardFilterOptions {
  campuses: string[];
  programs: string[];
  /** Ids present on the loaded leads. Names are resolved by the caller. */
  owners: string[];
  /** Whether any loaded lead has no owner — so "Unassigned" is only offered when it means something. */
  hasUnassigned: boolean;
}

/** Every value actually present, sorted, deduped, blanks dropped. */
export function deriveOptions(leads: readonly BoardLead[]): BoardFilterOptions {
  const campuses = new Set<string>();
  const programs = new Set<string>();
  const owners = new Set<string>();
  let hasUnassigned = false;

  for (const lead of leads) {
    const campus = campusOf(lead);
    if (campus) campuses.add(campus);

    const program = (lead.program ?? "").trim();
    if (program) programs.add(program);

    const owner = (lead.assigned_to_user_id ?? "").trim();
    if (owner) owners.add(owner);
    else hasUnassigned = true;
  }

  return {
    campuses: [...campuses].sort((a, b) => a.localeCompare(b)),
    programs: [...programs].sort((a, b) => a.localeCompare(b)),
    owners: [...owners].sort(),
    hasUnassigned,
  };
}

/** Does this lead survive the filters? All four are AND, which is what a person expects. */
export function matchesFilters(
  lead: BoardLead,
  filters: BoardFilters,
  now: number = Date.now()
): boolean {
  if (filters.q && !matchesQuery(lead, filters.q)) return false;


  if (filters.campus && campusOf(lead) !== filters.campus) return false;

  if (filters.program && (lead.program ?? "").trim() !== filters.program) return false;

  if (filters.owner) {
    const owner = (lead.assigned_to_user_id ?? "").trim();
    if (filters.owner === UNASSIGNED) {
      if (owner) return false;
    } else if (owner !== filters.owner) {
      return false;
    }
  }

  // Last, because it is the only one that costs a date parse.
  if (filters.waitingAtLeast > 0 && daysWaiting(lead, now) < filters.waitingAtLeast) {
    return false;
  }

  return true;
}

export function applyFilters(
  leads: readonly BoardLead[],
  filters: BoardFilters,
  now: number = Date.now()
): BoardLead[] {
  return leads.filter((lead) => matchesFilters(lead, filters, now));
}

/** How many are set — for the "3 filters" badge and for deciding whether to show Clear. */
export function activeFilterCount(filters: BoardFilters): number {
  let n = 0;
  if ((filters.q ?? "").trim()) n += 1;
  if (filters.campus) n += 1;
  if (filters.program) n += 1;
  if (filters.owner) n += 1;
  if (filters.waitingAtLeast > 0) n += 1;
  return n;
}

/**
 * URL round trip.
 *
 * The filters live in the query string so a narrowed board can be sent to
 * somebody — "here are your twelve" is a link, not a set of instructions. The
 * "Waiting on us" screen already does this with its campus tabs; this is the
 * same idea with four dimensions.
 *
 * Unset filters are omitted rather than written as empty, so an unfiltered
 * board has a clean URL and a shared link says only what was actually chosen.
 */
export function filtersToParams(filters: BoardFilters): URLSearchParams {
  const params = new URLSearchParams();
  const q = (filters.q ?? "").trim();
  if (q) params.set("q", q);
  if (filters.campus) params.set("campus", filters.campus);
  if (filters.program) params.set("program", filters.program);
  if (filters.owner) params.set("owner", filters.owner);
  if (filters.waitingAtLeast > 0) params.set("waiting", String(filters.waitingAtLeast));
  return params;
}

export function filtersFromParams(
  params: URLSearchParams | Readonly<Record<string, string | undefined>>
): BoardFilters {
  const get = (key: string): string => {
    if (params instanceof URLSearchParams) return params.get(key) ?? "";
    return (params as Record<string, string | undefined>)[key] ?? "";
  };

  // A hand-edited or stale ?waiting= must not become NaN and silently hide
  // every family — an unreadable value means no filter, not an empty board.
  const waitingRaw = Number.parseInt(get("waiting"), 10);
  const waitingAtLeast =
    Number.isFinite(waitingRaw) && waitingRaw > 0 ? waitingRaw : 0;

  return {
    q: get("q"),
    campus: get("campus"),
    program: get("program"),
    owner: get("owner"),
    waitingAtLeast,
  };
}
