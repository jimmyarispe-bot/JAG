/**
 * The admissions flow, in the order a family actually moves through it.
 *
 * SPLIT INTO TWO LISTS, 10 October 2026, at Jimmy's instruction after looking
 * at the dropdown on a card and finding four stages in it that are not part of
 * the flow and three that describe families who have already gone:
 *
 *   "the Declined, waitlisted and not returning should be taken out of the
 *    current admissions crm"
 *   "in the old students view/screen the only columns should be Decision
 *    Needed, Declined, and Alumni"
 *   "Relabel all Not Returning in curent Admissions CRM to Alumni"
 *
 * WHY ONE ARRAY STILL HOLDS EVERYTHING. A stage removed from this array is a
 * stage `leadStageLabel` can no longer name, and a child sitting on it shows a
 * raw database value, or nothing at all. The registry's own comment records
 * what that costs: Julian Oubre Towa vanished from the board entirely in
 * September because one stage was missing from a list. So every stage a lead
 * can hold stays here, and `group` decides where it is OFFERED:
 *
 *   pipeline  the thirteen steps of the live flow. The dropdown on a card in
 *             Current Admissions Pipeline offers exactly these.
 *   closed    the three Old Students columns. A family here has gone, or is
 *             waiting on a decision nobody has made.
 *   retired   not part of any flow today. Never offered anywhere. Kept so the
 *             type and any stored value survive, and so assessment can come
 *             back when it is built.
 *
 * THE `step` NUMBER IS EXPLICIT, NOT THE ARRAY INDEX. A number derived from
 * position silently renumbers every stage below any stage that is ever
 * filtered, hidden or added. These numbers are the ones people will say out
 * loud to each other - "she's at 4, waiting on a tour" - so they are written
 * down rather than computed. Only pipeline stages carry one: a number beside
 * Declined would say it is step fourteen of the flow, and it is not a step,
 * it is where the flow ended.
 *
 * SHADOW DAYS COME AFTER THE APPLICATION. Jimmy, 9 October, asked directly.
 * It matches ADMISSIONS_PIPELINE_STAGES, which has application at 70 and 80
 * and shadow days at 90 and 100.
 *
 * TWO LISTS STILL DESCRIBE THIS ONE FLOW - this, and
 * ADMISSIONS_PIPELINE_STAGES in lib/admissions/registry/stages.ts, which
 * drives the board columns. They now agree on order and on the two renamed
 * labels. They are still two places holding one fact. The dropdown should
 * read the registry; that is a larger change than this one.
 */
export type LeadStageGroup = "pipeline" | "closed" | "retired";

export const LEAD_STAGES = [
  { value: "new_inquiry", step: 1, group: "pipeline", label: "New Inquiry", color: "bg-slate-100 text-slate-700" },
  { value: "information_sent", step: 2, group: "pipeline", label: "Information Sent", color: "bg-blue-100 text-blue-700" },
  { value: "interview_scheduled", step: 3, group: "pipeline", label: "Interest Meeting Scheduled", color: "bg-sky-100 text-sky-700" },
  { value: "interest_meeting_held", step: 4, group: "pipeline", label: "Interest Meeting Held", color: "bg-cyan-100 text-cyan-700" },
  { value: "tour_requested", step: 5, group: "pipeline", label: "Tour Requested", color: "bg-teal-100 text-teal-700" },
  { value: "tour_scheduled", step: 6, group: "pipeline", label: "Tour Scheduled", color: "bg-sky-100 text-sky-700" },
  { value: "tour_completed", step: 7, group: "pipeline", label: "Tour Completed", color: "bg-cyan-100 text-cyan-700" },
  { value: "application_started", step: 8, group: "pipeline", label: "Application Started", color: "bg-indigo-100 text-indigo-700" },
  { value: "application_submitted", step: 9, group: "pipeline", label: "Application Submitted", color: "bg-violet-100 text-violet-700" },
  { value: "shadow_day_scheduled", step: 10, group: "pipeline", label: "Shadow Days Scheduled", color: "bg-teal-100 text-teal-700" },
  { value: "shadow_day_completed", step: 11, group: "pipeline", label: "Shadow Days Completed", color: "bg-teal-100 text-teal-800" },
  { value: "accepted", step: 12, group: "pipeline", label: "Accepted", color: "bg-emerald-100 text-emerald-700" },
  { value: "enrolled", step: 13, group: "pipeline", label: "Enrolled", color: "bg-green-100 text-green-800" },

  /*
   * ── OLD STUDENTS ─────────────────────────────────────────────────────────
   *
   * WAS "Waitlisted", RENAMED RATHER THAN REPLACED. Sedona Simeonov has been
   * on this stage since 25 August and nobody has told her mother anything,
   * because the waitlist letter is switched on and no code path can reach it.
   * A rename carries her across with her record and her forty-six days
   * intact; a new stage would have meant moving her by hand and losing the
   * history that shows how long she has waited.
   *
   * It is called Decision Needed because that is what is true about her.
   */
  { value: "waitlisted", step: null, group: "closed", label: "Decision Needed", color: "bg-orange-100 text-orange-900" },
  { value: "declined", step: null, group: "closed", label: "Declined", color: "bg-red-100 text-red-700" },
  /*
   * WAS "Not Returning". Thirteen children. They were students here, which is
   * the one thing "not returning" never said about them.
   */
  { value: "not_returning", step: null, group: "closed", label: "Alumni", color: "bg-slate-200 text-slate-700" },

  /*
   * ── RETIRED ──────────────────────────────────────────────────────────────
   *
   * Offered nowhere. No lead has ever held any of the three.
   *
   * records_requested and admissions_review arrived with the platform and
   * were never part of The Academy Way's process - no letter, no decision
   * gate, no step in the flow. They sat in the dropdown on every card for
   * months offering a school leader two moves that mean nothing.
   *
   * assessment_scheduled is different: not dead, unbuilt, and belonging to
   * two campuses rather than four. Jimmy, 9 October:
   *
   *   "schedule assessment and anything assessments related only relates to
   *    hs n virtual. when schedule assessments is selected an email is sent
   *    from heather to mahogany.murphy@theacademyway.org to schedule
   *    assessment with the specific parent/child selected"
   *
   * and on 10 October, on taking it out of the dropdown: "yes. we will add
   * assessment related later". It comes back as a pipeline stage when it is
   * built and scoped to a campus - a stage that applies to some schools and
   * not others needs the dropdown to know which school it is looking at.
   */
  { value: "records_requested", step: null, group: "retired", label: "Records Requested", color: "bg-purple-100 text-purple-700" },
  { value: "admissions_review", step: null, group: "retired", label: "Admissions Review", color: "bg-amber-100 text-amber-700" },
  { value: "assessment_scheduled", step: null, group: "retired", label: "Assessment Scheduled — HS and Virtual", color: "bg-cyan-100 text-cyan-700" },
] as const;

export type LeadStageValue = (typeof LEAD_STAGES)[number]["value"];

/**
 * The stages a school leader may move a child to in Current Admissions
 * Pipeline. Thirteen steps, numbered, in flow order.
 */
export const PIPELINE_LEAD_STAGES = LEAD_STAGES.filter((s) => s.group === "pipeline");

/**
 * What the dropdown on a card offers: the thirteen steps, then one way off
 * the board.
 *
 * "MOVE TO QUIET" IS A VERB. The thirteen above it are states - where a
 * child is. This one is an instruction: take this family off the pipeline.
 * They land in Decision Needed, the first Quiet Students column, because
 * that is what is true about them the moment a leader parks them - nothing
 * is moving and somebody still has to decide. Declined and Alumni are
 * judgements, and they are made on the Quiet Students page once the child is
 * out of the way of the families still in play.
 *
 * SO ONE STAGE CARRIES TWO WORDS, DELIBERATELY. The card says "Move to
 * Quiet" because the leader is doing something; the column says "Decision
 * Needed" because that is where they have arrived. Everywhere else in this
 * build two names for one thing has been a fault - this is the exception,
 * and it is written down so the next person does not quietly "fix" it.
 *
 * Added 10 October 2026, because taking Declined, Decision Needed and Alumni
 * out of this dropdown that morning left a board with no exit at all.
 */
export const BOARD_STAGE_OPTIONS: readonly {
  value: LeadStageValue;
  step: number | null;
  label: string;
}[] = [
  ...PIPELINE_LEAD_STAGES.map((s) => ({ value: s.value, step: s.step, label: s.label })),
  { value: "waitlisted", step: null, label: "Move to Quiet" },
];

/**
 * The three Old Students columns, in the order Jimmy named them:
 * "Decision Needed, Declined, and Alumni".
 */
export const OLD_STUDENT_LEAD_STAGES = LEAD_STAGES.filter((s) => s.group === "closed");

/** Just the values, for a database filter. */
export const OLD_STUDENT_LEAD_STAGE_VALUES: readonly LeadStageValue[] =
  OLD_STUDENT_LEAD_STAGES.map((s) => s.value);

/**
 * Every stage a school leader may actually choose, anywhere.
 *
 * The thirteen pipeline steps plus the three Old Students stages — because a
 * child has to be able to reach Declined from somewhere, and the case page is
 * where that happens. What it excludes is the retired three: Records
 * Requested, Admissions Review and Assessment Scheduled were offered on every
 * card for months and mean nothing, and "taken out of the current admissions
 * crm" means taken out of all of it, not just the board.
 */
export const SELECTABLE_LEAD_STAGES = LEAD_STAGES.filter((s) => s.group !== "retired");

export const PIPELINE_STAGES: LeadStageValue[] = [
  "new_inquiry",
  "information_sent",
  "tour_scheduled",
  "tour_completed",
  "application_started",
  "application_submitted",
  "records_requested",
  "admissions_review",
  "waitlisted",
];

export function leadStageLabel(value: string | null | undefined): string {
  return LEAD_STAGES.find((s) => s.value === value)?.label ?? value ?? "—";
}

export function leadStageColor(value: string | null | undefined): string {
  return LEAD_STAGES.find((s) => s.value === value)?.color ?? "bg-slate-100 text-slate-700";
}

export const SCHOLARSHIP_APPROVER = "Jimmy Arispe";
