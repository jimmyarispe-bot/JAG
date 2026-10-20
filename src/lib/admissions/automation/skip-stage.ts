/**
 * SKIP NEXT STAGE - the button on every school leader letter, and the page
 * behind it.
 *
 * Jimmy, 15 October 2026:
 *
 *   "beginning with the inquiry email and each time a school leader receives
 *    an email there always needs to be a button that says 'skip next stage' -
 *    this is in addition to whatever button/decision is already there."
 *
 * and, asked what he was actually after:
 *
 *   "a parent has complete the inquiry form, and then goes through the other
 *    stages but the school leader doesn't do the shadow days and just move to
 *    acceptance. this is just an example but can happen at any stage except
 *    the inquiry"
 *
 * ── NO NEW LETTER. NOT ONE ──────────────────────────────────────────────────
 *
 * The letters a school leader already receives carry, between them, every
 * button this needs. occasionForStage() decides which buttons the notes page
 * shows FROM THE CHILD'S STAGE, so landing a child on the right stage hands
 * the leader the right question without a word being written. The five
 * letters below are live, approved and have sent between them 93 times.
 *
 * ── THE LADDER, AND WHY IT LANDS ON A COMPLETION ────────────────────────────
 *
 * Skipping a stage means landing on the stage that stage would have ENDED at.
 * A first attempt landed on the start of the stage AFTER the skipped one,
 * which quietly skipped two stages per press: from New Inquiry it went to
 * Tour Completed, passing over the interest meeting AND the tour, and handed
 * the leader "Send the application" for a child who had seen nothing.
 *
 * THE LADDER IS DRIVEN BY LEAD_STAGES.step, NOT BY occasionForStage. That
 * function returns "interest_meeting" for application_submitted - it names
 * only the tour and shadow-day stages and everything else falls through - so
 * an occasion-driven ladder takes a child who has toured and applied and puts
 * her back at the tour. Jimmy's own example, arriving at the wrong end of the
 * flow. LEAD_STAGES.step is written down rather than computed, and its own
 * comment explains that it is written down for this kind of reason.
 *
 * ── NOTHING REACHES THE FAMILY ──────────────────────────────────────────────
 *
 * Asked directly what a press should send a parent, Jimmy chose: nothing yet,
 * and the leader gets the next letter with its own skip button on it. So this
 * file moves a child and writes one letter TO A SCHOOL LEADER. Every letter it
 * queues is a staff letter. No family hears anything until she presses the
 * button that was always there.
 *
 * ── NO `import "server-only"` ───────────────────────────────────────────────
 *
 * Same as post-call.ts and application-call.ts: adding it to email/divert.ts
 * on 3 October failed a Vercel build in eight seconds.
 *
 * THE CLIENT IS CAST, narrowly, for the reason call-token.ts records at
 * length: src/types/database.ts was generated on 9 July 2026 and knows about
 * neither skip_stage_token nor skipped_stages. These methods and no others.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { processCommunicationQueue } from "@/lib/admissions/communications/engine";
import { campusRunsTours, tourGateArmed } from "@/lib/admissions/tour";
import { LEAD_STAGES, leadStageLabel } from "@/lib/constants/admissions";
import type { LeadStageValue } from "@/lib/constants/admissions";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

type Row = Record<string, unknown>;
type Answer<T> = PromiseLike<{ data: T; error: { message: string } | null }>;

interface Query {
  select: (columns: string) => Query;
  eq: (column: string, value: string | boolean) => Query;
  or: (filter: string) => Query & Answer<Row[] | null>;
  maybeSingle: () => Answer<Row | null>;
  insert: (row: Row) => Answer<null>;
}
interface Filtered extends Answer<null> {
  eq: (column: string, value: string) => Filtered;
  select: (columns: string) => Answer<Row[] | null>;
}
interface Mutation {
  update: (values: Row) => Filtered;
}
interface UntypedAdmin {
  from: (table: string) => Query & Mutation;
}

function admin(): UntypedAdmin {
  return createServiceRoleClient() as unknown as UntypedAdmin;
}

function text(value: unknown): string | null {
  const out = typeof value === "string" ? value.trim() : "";
  return out ? out : null;
}

/** The pipeline step a stage sits on, or null for a closed or retired stage. */
function stepOf(stage: string | null | undefined): number | null {
  const found = LEAD_STAGES.find((s) => s.value === stage);
  return found && found.step != null ? found.step : null;
}

/** Every pipeline stage strictly above `from` and at or below `to`. */
function stagesBetween(from: number, to: number): LeadStageValue[] {
  return LEAD_STAGES.filter(
    (s) => s.step != null && s.step > from && s.step <= to
  ).map((s) => s.value as LeadStageValue);
}

export interface SkipTarget {
  /** The stage the child lands on - the completion of the skipped stage. */
  readonly landingStage: LeadStageValue;
  /** What a leader would call the stage being passed over. */
  readonly skippedLabel: string;
  /** The stages recorded as skipped, landing stage included. */
  readonly skipped: readonly LeadStageValue[];
  /** The trigger event whose letter asks her the next question. */
  readonly notesEvent: string;
}

/**
 * WHAT ONE PRESS DOES, AND IT IS EXACTLY ONE STAGE.
 *
 * Null means there is nothing to skip, and there are three ways to get it:
 * a child already at the shadow days, where the only thing left is the
 * decision and Jimmy said "no skip button here"; a child on a closed or
 * retired stage, which is not in the flow; and an unknown stage.
 */
export function skipTargetForStage(
  stage: string | null | undefined,
  schoolName: string | null | undefined
): SkipTarget | null {
  const step = stepOf(stage);
  if (step == null) return null;

  const runsTours = campusRunsTours(schoolName);

  /* Steps 1-2: the interest meeting is next. Landing on Interest Meeting Held
     hands her "Send the tour request" at GA and FL, "Send the shadow day
     invite" at HS and Virtual - the fork post-call.ts already draws. */
  if (step <= 2) {
    return {
      landingStage: "interest_meeting_held",
      skippedLabel: "Interest Meeting",
      skipped: stagesBetween(step, 4),
      notesEvent: "staff_inquiry_call_held",
    };
  }

  /* Steps 3-4: the tour is next WHERE THERE IS ONE. Tours are a GA and FL
     step; requireTourLink refuses them anywhere else by name. At HS and
     Virtual the shadow days come straight after the interest meeting, so that
     is what a press there skips. */
  if (step <= 4) {
    return runsTours
      ? {
          landingStage: "tour_completed",
          skippedLabel: "Tour",
          skipped: stagesBetween(step, 7),
          notesEvent: "staff_tour_held",
        }
      : {
          landingStage: "shadow_day_completed",
          skippedLabel: "Shadow Days",
          skipped: stagesBetween(step, 11),
          notesEvent: "staff_shadow_day_held",
        };
  }

  /* Steps 5-7: the application is next. Landing on Application Submitted
     asks the shadow-days question, and its letter - the shadow-days
     "Decision needed", one letter per question since 17 October (it was
     decision_gate_staff_email for all three) - is the one that asks her to
     decide. NOT a notes letter: the
     notes page would read occasionForStage('application_submitted') as the
     interest meeting and offer a tour to a child who has had one. */
  if (step <= 7) {
    return {
      landingStage: "application_submitted",
      skippedLabel: "Application",
      skipped: stagesBetween(step, 9),
      notesEvent: "staff_shadow_days_decision",
    };
  }

  /* Steps 8-9: the shadow days are next. THIS IS JIMMY'S OWN EXAMPLE - the
     leader who does not run the shadow days and goes straight to the
     decision. She lands on Shadow Days Completed and the Accept/Deny letter
     follows. */
  if (step <= 9) {
    return {
      landingStage: "shadow_day_completed",
      skippedLabel: "Shadow Days",
      skipped: stagesBetween(step, 11),
      notesEvent: "staff_shadow_day_held",
    };
  }

  /* Steps 10-13. The decision is what comes next and it is not skippable.
     Jimmy, on the Accept/Deny letter: "no skip button here". */
  return null;
}

export interface SkipSubject {
  readonly leadId: string;
  readonly studentName: string;
  readonly schoolName: string | null;
  readonly schoolId: string | null;
  readonly currentStage: string | null;
  readonly currentStageLabel: string;
  readonly target: SkipTarget | null;
  /** Stages already skipped for this child, so a second press can say so. */
  readonly alreadySkipped: readonly string[];
}

/**
 * Turning the token in the letter into a child.
 *
 * Modelled on call-token.ts line for line, and the rules there are the rules
 * here: 64 lowercase hex checked BEFORE the database is touched, one lead or
 * null, and null for every failure without saying which - telling somebody
 * guessing tokens that they are getting warm is the one thing this could get
 * badly wrong.
 *
 * THE STAGE IS READ LIVE, which is what makes an old email safe to press. A
 * leader pressing the skip button in a three-week-old inquiry notice is
 * shown where the child is TODAY and what will actually happen, not what
 * would have happened the day the letter was sent.
 */
export async function leadForSkipToken(token: string): Promise<SkipSubject | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const { data, error } = await admin()
    .from("admissions_leads")
    .select(
      "id, first_name, last_name, preferred_name, lead_stage, school_id, " +
        "skipped_stages, schools(name)"
    )
    .eq("skip_stage_token", token)
    .maybeSingle();

  if (error) {
    console.error("[skip-stage] token lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  const lead = data as Row;
  const leadId = String(lead.id ?? "");
  if (!leadId) return null;

  /* PostgREST returns an embedded row as an object or a one-element array. */
  const embedded = lead.schools as Row | Row[] | null;
  const school = (Array.isArray(embedded) ? embedded[0] : embedded) ?? null;
  const schoolName = text(school?.name);
  const stage = text(lead.lead_stage);

  return {
    leadId,
    studentName:
      text(lead.preferred_name) ||
      `${text(lead.first_name) ?? ""} ${text(lead.last_name) ?? ""}`.trim() ||
      "This student",
    schoolName,
    schoolId: text(lead.school_id),
    currentStage: stage,
    currentStageLabel: leadStageLabel(stage),
    target: skipTargetForStage(stage, schoolName),
    alreadySkipped: Array.isArray(lead.skipped_stages)
      ? (lead.skipped_stages as unknown[]).map(String)
      : [],
  };
}

/**
 * THE PRESS.
 *
 * Order matters and is the order post-call.ts uses for the same reason: the
 * child is moved and the skip recorded BEFORE the letter is attempted, so a
 * letter that will not queue never loses the move a school leader made. A
 * refused letter is reported to her on the page; a lost move is discovered
 * weeks later by a family nobody contacted.
 */
export async function skipNextStage(params: {
  token: string;
  /** The stage the page showed her. A press made against an older stage is
      a second press, and a second press does nothing. */
  expectedStage?: string | null;
}): Promise<
  | { ok: true; landedOn: string; letterProblem: string | null; alreadyDone: boolean }
  | { error: string }
> {
  const subject = await leadForSkipToken(params.token);
  if (!subject) return { error: "That link is not valid." };

  /*
   * ONE PRESS, ONE STAGE - ENFORCED HERE, 19 OCTOBER 2026.
   *
   * John Nygren (FL). Danni pressed Skip on the inquiry letter once. The
   * history shows two moves four seconds apart: New Inquiry -> Interest
   * Meeting Held at 15:44:30, then Interest Meeting Held -> Tour Completed at
   * 15:44:34, and two "happening now; TAKE notes" letters. The second letter
   * landed two seconds before the second move, so nobody read it and pressed
   * again - the form was submitted twice. The redirect stops a refresh; it
   * never stopped a double tap. The page now sends the stage it showed, and a
   * press against any other stage is a no-op.
   */
  if (params.expectedStage && params.expectedStage !== subject.currentStage) {
    return {
      ok: true,
      landedOn: subject.currentStageLabel,
      letterProblem: null,
      alreadyDone: true,
    };
  }

  const target = subject.target;
  if (!target) {
    return {
      error:
        `There is no stage to skip for ${subject.studentName}. ` +
        `${subject.studentName} is at ${subject.currentStageLabel}, and what comes ` +
        `next is your decision, which is yours to make rather than skip.`,
    };
  }

  const db = admin();

  /*
   * THE MOVE IS CONDITIONAL ON THE STAGE STILL BEING THE ONE READ, so two
   * presses that arrive together cannot both move the child. Whichever lands
   * second updates nothing and is told the skip is already done. This now
   * goes BEFORE the history row: the conditional update is the lock, and a
   * history row for a move that did not happen would be worse than none.
   */
  const merged = Array.from(
    new Set([...subject.alreadySkipped, ...target.skipped])
  );

  const { data: moved, error: updateError } = await db
    .from("admissions_leads")
    .update({ lead_stage: target.landingStage, skipped_stages: merged })
    .eq("id", subject.leadId)
    .eq("lead_stage", subject.currentStage ?? "")
    .select("id");

  if (updateError) {
    console.error("[skip-stage] stage update failed:", updateError.message);
    return { error: "That did not save. Tell Jimmy before you press it again." };
  }
  if (!moved || moved.length === 0) {
    return {
      ok: true,
      landedOn: subject.currentStageLabel,
      letterProblem: null,
      alreadyDone: true,
    };
  }

  /* The history row, and its error is read, and its error is read. A stage that moved with no
     history is a move nobody can account for afterwards, and this table is
     the only record of who skipped what. */
  const { error: historyError } = await db
    .from("admissions_lead_stage_history")
    .insert({
      lead_id: subject.leadId,
      previous_stage: subject.currentStage,
      new_stage: target.landingStage,
      changed_by: null,
      changed_at: new Date().toISOString(),
    });

  /* The child has moved; a missing history row is reported, not fatal. */
  if (historyError) {
    console.error("[skip-stage] history insert failed:", historyError.message);
  }

  /* The letter's button is /post-call/<token>. A child who never had an
     interest meeting booked has no post-call token, and the letter fell back
     to the case page - which is why Danni's letter had no tour button. */
  await ensurePostCallToken(db, subject.leadId);

  const letterProblem = await queueStaffLetter(db, {
    leadId: subject.leadId,
    schoolId: subject.schoolId,
    triggerEvent: target.notesEvent,
    letter: skipLetterFor(target, subject.schoolName),
  });

  /*
   * DRAINED HERE, NOT LEFT FOR THE CRON.
   *
   * Queueing a letter is not sending one. Nothing leaves
   * admissions_communication_queue until processCommunicationQueue runs, and
   * the only things that run it on a schedule are the queue crons - which
   * exist to cover 7am and 8am Eastern, not to answer a button somebody is
   * standing in front of. Jimmy's instruction is that the leader "should then
   * receive the next email", and a letter that arrives at the next cron is
   * not that.
   *
   * THE SERVICE-ROLE CLIENT IS WHAT THIS TAKES, and it is not a liberty:
   * /api/admissions/process-communications already calls it with exactly this
   * client on the cron path. There is no signed-in user on this page to
   * borrow one from.
   *
   * A FAILURE HERE DOES NOT UNDO THE SKIP. The row is queued and the move is
   * made; the worst case is the letter going out at the next cron instead of
   * now, which is the behaviour this call improves on rather than depends on.
   */
  if (!letterProblem) {
    try {
      await processCommunicationQueue(
        createServiceRoleClient() as unknown as Parameters<typeof processCommunicationQueue>[0]
      );
    } catch (err) {
      console.error("[skip-stage] the letter is queued but did not send now:", err);
    }
  }

  return {
    ok: true,
    landedOn: leadStageLabel(target.landingStage),
    letterProblem: historyError
      ? letterProblem ?? "The stage was skipped, but the history row did not save. Tell Jimmy."
      : letterProblem,
    alreadyDone: false,
  };
}

/**
 * The next question, queued for a school leader and nobody else.
 *
 * A COPY OF queueLetter() IN chase/run.ts RATHER THAN A SHARED HELPER, and
 * deliberately: that one takes the cookie-bound AuthClient and this page has
 * no sign-in at all. Hoisting it would mean giving the chase's letter writer
 * a service-role path, which is a larger blast radius than one duplicated
 * insert. The rule it keeps is the engine's: a campus override wins over the
 * network-wide row.
 *
 * SENT NOW, NOT SCHEDULED. The notes letters are normally queued for the
 * appointment's start time, because they ask about an appointment that has
 * not happened yet. This one asks about a stage that is not going to happen
 * at all, so there is no moment to wait for.
 */
async function queueStaffLetter(
  db: UntypedAdmin,
  params: {
    leadId: string;
    schoolId: string | null;
    triggerEvent: string;
    letter: SkipLetter | null;
  }
): Promise<string | null> {
  if (!params.schoolId) return "This child has no campus on the record, so no letter was sent.";

  /*
   * EVERY MATCHING ROW, NOT maybeSingle(). staff_shadow_day_held has FIVE
   * campus rows and staff_tour_held has one network-wide row, so the call
   * that works for one throws for the other. The .or() is the same filter
   * queueLetter() uses in chase/run.ts.
   */
  const { data, error } = await db
    .from("admissions_communication_templates")
    .select("id, template_key, channel, school_id")
    .eq("trigger_event", params.triggerEvent)
    .eq("is_active", true)
    .or(`school_id.is.null,school_id.eq.${params.schoolId}`);

  if (error) {
    console.error("[skip-stage] template lookup failed:", error.message);
    return "The stage was skipped, but the next letter could not be found.";
  }

  const rows = (data ?? []) as Row[];
  if (!rows.length) {
    return `The stage was skipped, but no active letter is set up for ${params.triggerEvent}.`;
  }

  /* A campus override wins over the network-wide version. The engine's rule. */
  const template = rows.find((r) => text(r.school_id)) ?? rows[0];

  const { error: queueError } = await db.from("admissions_communication_queue").insert({
    lead_id: params.leadId,
    application_id: null,
    template_id: String(template.id ?? ""),
    template_key: String(template.template_key ?? ""),
    trigger_event: params.triggerEvent,
    channel: String(template.channel ?? "email"),
    scheduled_for: new Date().toISOString(),
    status: "pending",
    custom_subject: params.letter?.subject ?? null,
    custom_body: params.letter?.body ?? null,
    merge_overrides: null,
  });

  if (queueError) {
    console.error("[skip-stage] could not queue the letter:", queueError.message);
    return "The stage was skipped, but the next letter did not queue. Tell Jimmy.";
  }

  return null;
}

/**
 * WHAT A SKIPPED STAGE'S LETTER SAYS.
 *
 * Danni, 19 October 2026, on the letter a skip sent her:
 *
 *   "it sent me an email that said: 'Meeting with Parent is happening now,
 *    take notes email' It should have said: Send the schedule tour link.
 *    (the parent still has not received an email from me)."
 *
 * The notes letters are written for an appointment that is happening now. A
 * skipped stage is not happening at all, so the same template is sent with
 * its subject and body replaced: what was skipped, that the family has heard
 * nothing, and the one button that sends them the next thing. The button is
 * the post-call page, which already offers exactly that question for the
 * stage the child lands on.
 *
 * The application skip keeps its letter: "Decision needed" is already the
 * right question.
 */
export interface SkipLetter {
  readonly subject: string;
  readonly body: string;
}

const CHILD_FACTS =
  "{{student_full_name}}\r\n{{student_grade}}\r\n{{student_age}}\r\n{{parent_phone}}";

export function skipLetterFor(
  target: SkipTarget,
  schoolName: string | null | undefined
): SkipLetter | null {
  if (target.notesEvent === "staff_inquiry_call_held") {
    const tour = tourGateArmed() && campusRunsTours(schoolName);
    const action = tour ? "Send the schedule tour link" : "Send the shadow day invite";
    return {
      subject: `${action}: {{student_full_name}}`,
      body:
        "You skipped the interest meeting for {{student_full_name}}. " +
        "{{guardian_name}} has not received an email from you yet.\r\n\r\n" +
        `${action}:\r\n\r\n{{post_call_link}}\r\n\r\n` +
        `${CHILD_FACTS}\r\n\r\n{{skip_stage_link}}`,
    };
  }
  if (target.notesEvent === "staff_tour_held") {
    return {
      subject: "Send the application: {{student_full_name}}",
      body:
        "You skipped the tour for {{student_full_name}}. " +
        "{{guardian_name}} has not received an email from you yet.\r\n\r\n" +
        "Send the application:\r\n\r\n{{post_call_link}}\r\n\r\n" +
        `${CHILD_FACTS}\r\n\r\n{{skip_stage_link}}`,
    };
  }
  if (target.notesEvent === "staff_shadow_day_held") {
    return {
      subject: "Accept or deny: {{student_full_name}}",
      body:
        "You skipped the shadow days for {{student_full_name}}. " +
        "{{guardian_name}} has not received an email from you yet.\r\n\r\n" +
        "Accept or deny {{student_first_name}}:\r\n\r\n{{post_call_link}}\r\n\r\n" +
        CHILD_FACTS,
    };
  }
  return null;
}

/** Minted once and reused - the rule mintPostCallToken in chase/run.ts keeps. */
async function ensurePostCallToken(db: UntypedAdmin, leadId: string): Promise<void> {
  const { data } = await db
    .from("admissions_leads")
    .select("post_call_token")
    .eq("id", leadId)
    .maybeSingle();
  if (text((data as Row | null)?.post_call_token)) return;

  const token = (
    globalThis.crypto.randomUUID() + globalThis.crypto.randomUUID()
  ).replace(/-/g, "");

  const { error } = await db
    .from("admissions_leads")
    .update({ post_call_token: token })
    .eq("id", leadId);
  if (error) console.error("[skip-stage] post-call token not minted:", error.message);
}
