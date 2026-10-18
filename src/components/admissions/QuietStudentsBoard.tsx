"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useActionFeedback } from "@/components/experience-system/feedback";
import { updateCaseStage } from "@/lib/admissions/case/actions";
import { scheduleAppointmentAndAdvance } from "@/lib/admissions/actions";
import {
  stageRequiresAppointment,
  type AppointmentStage,
} from "@/lib/admissions/appointment-stages";
import { ScheduleAppointmentDialog } from "./ScheduleAppointmentDialog";
import { fullRecordHref } from "./AdmissionsPipelineBoard";
import { PipelineFilters } from "./PipelineFilters";
import {
  applyFilters,
  filtersFromParams,
  type BoardFilters,
  type BoardLead,
} from "@/lib/admissions/board-filters";
import {
  CHOOSABLE_BOARD_GROUPS,
  OLD_STUDENT_LEAD_STAGES,
  boardGroupLabel,
  type LeadStageValue,
} from "@/lib/constants/admissions";

/**
 * 18 OCTOBER 2026 - FOUR COLUMNS, AND A WAY BACK.
 *
 * Jimmy: "the only stages in the quiet students dropdown and columns should
 * be 1. ... alumni ... No- our decision 4. No - family decision 5. move to
 * current pipeline. when move to pipeline is selected it should exactly that
 * after asking user what stage student should move to" - with Waitlisted in,
 * renamed Holding Pattern, and Not Returning out (it is Alumni).
 *
 * Columns: Alumni, Holding Pattern, No - our decision, No - family decision.
 * Each card has a dropdown with those four and Move to Current Pipeline,
 * which asks which of the six stages (or Enrolled) and then moves the child
 * there. It never guesses and never drops a child at stage 1 by default.
 */

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

const TO_PIPELINE = "__move_to_current_pipeline__";

export interface QuietStudentsBoardProps {
  leads: readonly BoardLead[];
}

export function QuietStudentsBoard({ leads }: QuietStudentsBoardProps) {
  const router = useRouter();
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Move", loading: "Moving…", success: "✓ Moved" },
    successToast: "✓ Moved.",
    errorToast: "Unable to move this child.",
    progressLabel: "Moving…",
  });

  const [filters, setFilters] = useState<BoardFilters>(() =>
    filtersFromParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search)
    )
  );

  /* The child whose card is asking "which stage?", and the answer so far. */
  const [asking, setAsking] = useState<{ leadId: string; group: string } | null>(null);
  const [pending, setPending] = useState<{
    leadId: string;
    stage: AppointmentStage;
    studentName: string;
  } | null>(null);

  const visible = useMemo(() => applyFilters(leads, filters), [leads, filters]);

  const byStage = useMemo(() => {
    const map = new Map<string, BoardLead[]>();
    for (const stage of OLD_STUDENT_LEAD_STAGES) map.set(stage.value, []);
    for (const lead of visible) {
      const bucket = map.get(String(row(lead).lead_stage ?? ""));
      if (bucket) bucket.push(lead);
    }
    for (const rows of map.values()) {
      rows.sort((a, b) => {
        const aAt = daysSince(row(a).created_at) ?? -1;
        const bAt = daysSince(row(b).created_at) ?? -1;
        return bAt - aAt;
      });
    }
    return map;
  }, [visible]);

  const quietTotal = useMemo(
    () => [...byStage.values()].reduce((n, rows) => n + rows.length, 0),
    [byStage]
  );

  function moveTo(leadId: string, stage: LeadStageValue, studentName: string) {
    if (stageRequiresAppointment(stage)) {
      setPending({ leadId, stage, studentName });
      return;
    }
    void action.run(async () => {
      const result = await updateCaseStage(leadId, stage);
      if (result && "error" in result && result.error) throw new Error(result.error);
      setAsking(null);
      router.refresh();
      return { success: true };
    });
  }

  function confirmAppointment(input: { scheduledAt: string; appointmentType: string; notes: string }) {
    if (!pending) return;
    const { leadId, stage } = pending;
    void action.run(async () => {
      const result = await scheduleAppointmentAndAdvance({
        leadId,
        leadStage: stage,
        scheduledAt: input.scheduledAt,
        appointmentType: input.appointmentType,
        notes: input.notes,
      });
      if (result && "error" in result && result.error) throw new Error(result.error);
      setPending(null);
      setAsking(null);
      router.refresh();
      return { success: true };
    });
  }

  function handleChoice(leadId: string, current: string, choice: string, studentName: string) {
    if (choice === TO_PIPELINE) {
      setAsking({ leadId, group: "" });
      return;
    }
    if (choice === current) return;
    moveTo(leadId, choice as LeadStageValue, studentName);
  }

  return (
    <>
      <ScheduleAppointmentDialog
        key={pending ? `${pending.leadId}:${pending.stage}` : "closed"}
        open={pending !== null}
        stage={pending?.stage ?? null}
        studentName={pending?.studentName ?? ""}
        busy={action.isBusy}
        onCancel={() => setPending(null)}
        onConfirm={confirmAppointment}
      />

      <PipelineFilters
        leads={leads}
        filters={filters}
        shownCount={quietTotal}
        onChange={setFilters}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {OLD_STUDENT_LEAD_STAGES.map((stage, index) => {
          const rows = byStage.get(stage.value) ?? [];
          const holding = stage.value === "waitlisted";

          return (
            <section
              key={stage.value}
              className={`rounded-2xl border p-4 ${
                holding ? "border-orange-300 bg-orange-50/60" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className={`text-sm font-semibold ${holding ? "text-orange-900" : "text-slate-900"}`}>
                  {index + 1}. {stage.label}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    holding ? "bg-orange-200 text-orange-900" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {rows.length}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {rows.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                    Nobody
                  </p>
                )}

                {rows.map((lead) => {
                  const r = row(lead);
                  const id = String(r.id);
                  const name = fullName(r);
                  const days = daysSince(r.created_at);
                  const guardian = guardianName(r);
                  const isAsking = asking?.leadId === id;
                  return (
                    <div
                      key={id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(fullRecordHref(id))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") router.push(fullRecordHref(id));
                      }}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-400"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={fullRecordHref(id)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-slate-900 hover:text-brand-600"
                        >
                          {name}
                        </Link>
                        {days !== null && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            {days}d
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {String((r.schools as { name?: string } | null)?.name ?? "—")}
                      </p>
                      {guardian && <p className="mt-1 text-xs text-slate-400">{guardian}</p>}

                      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        {isAsking ? (
                          <div className="mt-2 space-y-2 rounded-lg border border-brand-200 bg-brand-50/50 p-2">
                            <p className="text-xs font-medium text-slate-700">
                              Which stage should {name} move to?
                            </p>
                            <select
                              value={asking.group}
                              onChange={(e) => setAsking({ leadId: id, group: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                              aria-label={`Pipeline stage for ${name}`}
                            >
                              <option value="">Choose a stage…</option>
                              {CHOOSABLE_BOARD_GROUPS.map((g) => (
                                <option key={g.key} value={g.key}>
                                  {boardGroupLabel(g)}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={!asking.group || action.isBusy}
                                onClick={() => {
                                  const group = CHOOSABLE_BOARD_GROUPS.find((g) => g.key === asking.group);
                                  if (!group) return;
                                  moveTo(id, group.entry, name);
                                }}
                                className="flex-1 rounded-lg bg-brand-700 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                              >
                                {action.isBusy ? "Moving…" : "Move"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setAsking(null)}
                                className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <select
                            value={stage.value}
                            disabled={action.isBusy}
                            onChange={(e) => handleChoice(id, stage.value, e.target.value, name)}
                            className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 disabled:opacity-50"
                            aria-label={`Quiet column for ${name}`}
                          >
                            {OLD_STUDENT_LEAD_STAGES.map((s, i) => (
                              <option key={s.value} value={s.value}>
                                {i + 1}. {s.label}
                              </option>
                            ))}
                            <option value={TO_PIPELINE}>
                              {OLD_STUDENT_LEAD_STAGES.length + 1}. Move to Current Pipeline
                            </option>
                          </select>
                        )}
                      </div>
                    </div>
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
