import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * The 48-hour parent reminder.
 *
 * When a family is waiting on US, the pending-decisions page shows it. When WE
 * are waiting on the FAMILY, nothing has ever happened — the lead sits at a
 * stage until somebody notices. 289 leads; 111 of them parked.
 *
 * WHY THIS POLLS INSTEAD OF SCHEDULING.
 * `scheduleApplicationIncompleteReminders` in communications/engine.ts already
 * exists and does the obvious thing: at the moment an application starts, it
 * fires all three reminders into the queue at once. Nothing cancels the later
 * two if the parent finishes on day four — they are already queued, and they
 * will arrive. This module instead holds STATE in admissions_parent_reminders
 * (migration 294) and recomputes the real world on every run. A family that has
 * done the thing is resolved and hears nothing more. Nothing is ever queued
 * before the night it is due.
 *
 * WHY NOT ON THE DECISION GATES. admissions_decision_gates has notify_count and
 * notified_at, which look like exactly the right fields, and are not: all three
 * gates ask a SCHOOL LEADER a question. Reusing them would have chased you.
 */

const HOUR_MS = 60 * 60 * 1000;

/**
 * WHEN EACH REMINDER IS DUE, IN HOURS FROM THE MOMENT THE WAIT OPENED.
 *
 * Jimmy, 4 October 2026: "the 3 reminders need to go out at 24 hours, 72, 96
 * hours. if we don't receive an application after 5 days send the school
 * leader the same type of 'it's time to give the parent a call' email".
 *
 * MEASURED FROM waiting_since, NOT FROM THE LAST ONE SENT. The old code added
 * a flat 48 hours to last_reminded_at, which means a night this job does not
 * run pushes every later reminder back by a night and the schedule quietly
 * becomes a function of the server's uptime. Cumulative hours from the
 * opening of the wait cannot drift: a missed night catches up on the next
 * run. Same rule, and the same reason, as the interest-meeting chase clock -
 * checkpoints are `>=`, not `==`.
 *
 * THE OTHER TWO WAITS DO NOT MOVE. 48, 96, 144 and escalate at 192 is exactly
 * what the flat interval produced, now written down instead of implied. Jimmy
 * asked about the application; nothing else changes until he says so.
 */
interface WaitSchedule {
  /** Hours from waiting_since at which reminders 1, 2 and 3 fall due. */
  readonly reminders: readonly number[];
  /** Hours from waiting_since at which a person is handed the problem. */
  readonly escalateAt: number;
}

const SCHEDULE: Record<ParentWaitKey, WaitSchedule> = {
  /* Two to the campus, then out of the campus's hands. */
  interest_link_not_sent: { reminders: [24, 48], escalateAt: 72 },
  application_not_started: { reminders: [24, 72, 96], escalateAt: 120 },
  application_not_submitted: { reminders: [24, 72, 96], escalateAt: 120 },
  shadow_days_not_scheduled: { reminders: [48, 96, 144], escalateAt: 192 },
  enrollment_not_completed: { reminders: [48, 96, 144], escalateAt: 192 },
};

/** Nothing is sent for a lead that has already left the pipeline. */
const TERMINAL_STAGES = new Set([
  "enrolled",
  "declined",
  "not_returning",
  "waitlisted",
]);

export type ParentWaitKey =
  /**
   * THE ONLY WAIT WHERE WE ARE WAITING ON US.
   *
   * Jimmy, 4 October: the interest meeting link is no longer sent by the
   * form. A school leader reads the inquiry and presses send. Nothing at all
   * reaches the family until she does, which is what makes this chase the
   * one that matters most - 24 and 48 hours to the campus, then Jimmy and
   * Danni at 72.
   */
  | "interest_link_not_sent"
  | "application_not_started"
  | "application_not_submitted"
  | "shadow_days_not_scheduled"
  | "enrollment_not_completed";

const WAIT_TEMPLATE_KEY: Record<ParentWaitKey, string> = {
  interest_link_not_sent: "staff_interest_link_not_sent",
  application_not_started: "parent_reminder_application_not_started",
  application_not_submitted: "parent_reminder_application_not_submitted",
  shadow_days_not_scheduled: "parent_reminder_shadow_days_not_scheduled",
  enrollment_not_completed: "parent_reminder_enrollment_not_completed",
};

/**
 * THE ESCALATION LETTER IS NO LONGER ONE LETTER FOR ALL FOUR WAITS.
 *
 * staff_parent_unresponsive is a notice: it says what happened and leaves the
 * reader to go and do something about it in another tab. For the two
 * application waits Jimmy asked for the shape the interest-meeting chase
 * already uses - a letter that carries a link to a page with the telephone
 * number on it and the decision on the same screen.
 *
 * The other two waits keep the notice, because nobody has written the words
 * for their version and a letter a human reads does not ship before he has
 * seen it.
 */
const ESCALATION_TEMPLATE_KEY: Record<ParentWaitKey, string> = {
  interest_link_not_sent: "staff_interest_link_escalation",
  application_not_started: "staff_application_call_parent",
  application_not_submitted: "staff_application_call_parent",
  shadow_days_not_scheduled: "staff_parent_unresponsive",
  enrollment_not_completed: "staff_parent_unresponsive",
};

/**
 * Waits where the person being chased is STAFF, not the family.
 *
 * It matters at one line: a family with no email address cannot be reminded,
 * and is counted rather than skipped quietly. A school leader can be
 * reminded perfectly well about a family who gave us no address - in fact
 * that is a family she especially needs to look at.
 */
const STAFF_WAITS = new Set<ParentWaitKey>(["interest_link_not_sent"]);

/** The two waits whose escalation carries buttons rather than a sentence. */
const WAITS_WITH_BUTTONS = new Set<ParentWaitKey>([
  "application_not_started",
  "application_not_submitted",
]);

/**
 * The single-use link in that letter.
 *
 * MINTED ONCE AND REUSED, exactly like the interest-meeting token. A leader
 * escalated twice about the same family should not find her first link dead.
 * 64 lowercase hex, the same shape as the application token and the fee link,
 * and read by exactly one route.
 */
async function mintApplicationCallToken(
  supabase: AuthClient,
  leadId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("admissions_leads")
    .select("application_call_token")
    .eq("id", leadId)
    .maybeSingle();

  const held = (existing as { application_call_token?: string | null } | null)
    ?.application_call_token;
  if (held) return held;

  const token = (
    globalThis.crypto.randomUUID() + globalThis.crypto.randomUUID()
  ).replace(/-/g, "");

  const { error } = await supabase
    .from("admissions_leads")
    .update({ application_call_token: token })
    .eq("id", leadId);

  return error ? null : token;
}

export interface ParentReminderRunSummary {
  readonly opened: number;
  readonly resolved: number;
  readonly remindersSent: number;
  readonly escalated: number;
  /** Leads in a wait with no usable email. Reported, never silently dropped. */
  readonly skippedNoEmail: number;
  readonly errors: string[];
}

interface LeadRow {
  id: string;
  school_id: string;
  lead_stage: string | null;
  guardian_email: string | null;
  /**
   * When automated follow-up was switched on for this family. Rows reaching
   * this engine always have it set — the query filters on it — but it is
   * carried so anything downstream can say WHEN a family was opted in rather
   * than assuming it always was.
   */
  automation_started_at: string | null;
  /** When the inquiry arrived. The interest-link clock runs from here. */
  created_at: string | null;
}

interface OpenReminderRow {
  id: string;
  lead_id: string;
  wait_key: string;
  waiting_since: string;
  reminders_sent: number;
  last_reminded_at: string | null;
}

/**
 * Work out, from live data, which lead is currently waiting on which of the
 * four things. This is the whole design: it is recomputed every run, so the
 * answer is never stale and a completed step stops the chase immediately.
 */
async function currentWaits(
  supabase: AuthClient,
  leads: LeadRow[]
): Promise<Map<ParentWaitKey, Set<string>>> {
  const leadIds = leads.map((l) => l.id);
  const waits = new Map<ParentWaitKey, Set<string>>([
    ["interest_link_not_sent", new Set()],
    ["application_not_started", new Set()],
    ["application_not_submitted", new Set()],
    ["shadow_days_not_scheduled", new Set()],
    ["enrollment_not_completed", new Set()],
  ]);
  if (!leadIds.length) return waits;

  const [gatesResult, appsResult, packetsResult, firstLetterResult] = await Promise.all([
    supabase
      .from("admissions_decision_gates")
      .select("lead_id, gate_key, answer, status")
      .in("lead_id", leadIds)
      .eq("status", "answered"),
    supabase
      .from("admissions_applications")
      .select("id, lead_id, submitted_at")
      .in("lead_id", leadIds),
    supabase
      .from("enrollment_packets")
      .select("lead_id, packet_status")
      .in("lead_id", leadIds),
    /*
     * HAS THE FAMILY HEARD FROM US AT ALL YET.
     *
     * The sent log, not a flag on the lead. A flag would have to be kept in
     * step with the thing it describes, and the thing it describes is "an
     * email left the building" - which admissions_communications already
     * records, for both versions of the letter.
     */
    supabase
      .from("admissions_communications")
      .select("lead_id, template_key")
      .in("lead_id", leadIds)
      .in("template_key", ["inquiry_thank_you_email", "inquiry_thank_you_email_no_link"]),
  ]);

  // A refused read returns no rows, which here would read as "nobody is
  // waiting on anything" and quietly stop every reminder in the system. Say so
  // instead.
  if (gatesResult.error) throw new Error(`gates: ${gatesResult.error.message}`);
  if (appsResult.error) throw new Error(`applications: ${appsResult.error.message}`);
  if (packetsResult.error) throw new Error(`packets: ${packetsResult.error.message}`);
  if (firstLetterResult.error) {
    throw new Error(`first letter: ${firstLetterResult.error.message}`);
  }

  const invitedToApply = new Set<string>();
  const invitedToShadow = new Set<string>();
  for (const g of gatesResult.data ?? []) {
    if (g.answer !== "yes") continue;
    if (g.gate_key === "invite_to_apply") invitedToApply.add(g.lead_id as string);
    if (g.gate_key === "invite_to_shadow_days") invitedToShadow.add(g.lead_id as string);
  }

  const hasApplication = new Set<string>();
  const unsubmitted = new Set<string>();
  for (const a of appsResult.data ?? []) {
    hasApplication.add(a.lead_id as string);
    if (!a.submitted_at) unsubmitted.add(a.lead_id as string);
  }

  const firstLetterSent = new Set<string>();
  for (const c of firstLetterResult.data ?? []) {
    firstLetterSent.add(c.lead_id as string);
  }

  const completedPacket = new Set<string>();
  for (const p of packetsResult.data ?? []) {
    if (p.packet_status === "completed") completedPacket.add(p.lead_id as string);
  }

  for (const lead of leads) {
    const stage = lead.lead_stage ?? "";
    if (TERMINAL_STAGES.has(stage)) continue;

    // 0. The inquiry arrived and nobody has sent them the booking link.
    //    Stage-gated on purpose: once a family has moved on, this is moot
    //    however the letter got skipped.
    if (stage === "new_inquiry" && !firstLetterSent.has(lead.id)) {
      waits.get("interest_link_not_sent")!.add(lead.id);
    }

    // 1. We invited them to apply and no application exists at all.
    if (invitedToApply.has(lead.id) && !hasApplication.has(lead.id)) {
      waits.get("application_not_started")!.add(lead.id);
    }

    // 2. They started one and never sent it.
    if (unsubmitted.has(lead.id)) {
      waits.get("application_not_submitted")!.add(lead.id);
    }

    // 3. We invited them to shadow days and nothing is in the diary. The stage
    //    is the signal here, because booking is what moves it.
    if (
      invitedToShadow.has(lead.id) &&
      stage !== "shadow_day_scheduled" &&
      stage !== "shadow_day_completed" &&
      stage !== "accepted"
    ) {
      waits.get("shadow_days_not_scheduled")!.add(lead.id);
    }

    // 4. Accepted, paperwork unfinished. A missing packet counts: the family
    //    still has something to do either way.
    if (stage === "accepted" && !completedPacket.has(lead.id)) {
      waits.get("enrollment_not_completed")!.add(lead.id);
    }
  }

  return waits;
}

/** Queue one email. The existing communication engine does the sending. */
async function enqueue(
  supabase: AuthClient,
  params: {
    leadId: string;
    schoolId: string;
    templateKey: string;
    templatesBySchool: Map<string, Map<string, { id: string; trigger_event: string; channel: string }>>;
    /**
     * Rendered at the moment of queueing rather than left to the engine.
     *
     * A queued letter is otherwise rendered from the LEAD when it finally goes
     * out, and that path knows nothing about a token minted tonight. This is
     * the same hole that made the 24-hour interest-meeting reminder read
     * "tomorrow at ." for as long as it has existed, and merge_overrides -
     * migration 479 - is the thing built to close it.
     */
    mergeOverrides?: Record<string, unknown> | null;
  }
): Promise<boolean> {
  const template = params.templatesBySchool.get(params.schoolId)?.get(params.templateKey);
  // A template missing for THIS school is the exact failure that made
  // staff_application_submitted look broken — the row existed, just not where
  // the lead was. Return false and let the caller count it.
  if (!template) return false;

  const { error } = await supabase.from("admissions_communication_queue").insert({
    lead_id: params.leadId,
    application_id: null,
    template_id: template.id,
    template_key: params.templateKey,
    trigger_event: template.trigger_event,
    channel: template.channel,
    scheduled_for: new Date().toISOString(),
    status: "pending",
    merge_overrides: params.mergeOverrides ?? null,
  });
  return !error;
}

export async function processParentReminders(): Promise<ParentReminderRunSummary> {
  // THIS JOB RUNS AS THE SERVICE ROLE, WHOEVER TRIGGERED IT.
  //
  // The caller's client is deliberately ignored. Two reasons, both learned the
  // hard way on 6 September:
  //
  // 1. admissions_parent_reminders (294) has a read policy and NO insert
  //    policy -- by design, because the only writer was meant to be this job.
  //    But processAllPlatformQueues is handed a COOKIE client by
  //    /dashboard/admissions/automation, and every insert was silently refused
  //    by RLS. The errors were collected; that page discards the summary.
  //
  // 2. Even where it would work, chasing families should not depend on WHO
  //    loaded a page. A job whose output varies with the trigger's row
  //    visibility is the same class of bug as the cron that authenticated as
  //    nobody: it looks like it ran, and it did nothing.
  const supabase = createServiceRoleClient() as unknown as AuthClient;
  const errors: string[] = [];
  let opened = 0;
  let resolved = 0;
  let remindersSent = 0;
  let escalated = 0;
  let skippedNoEmail = 0;

  const [leadsResult, openResult, templatesResult] = await Promise.all([
    /**
     * THE GATE. Only leads a human (or the public inquiry form) has switched on.
     *
     * This read used to have no filter at all, which meant every lead in the
     * database was in scope for automated chasing - 289 families, including the
     * 113 parked at `information_sent` since 2 February 2026. The only thing
     * preventing that was an instruction not to run the job, which is not a
     * safeguard, it is a habit.
     *
     * `automation_started_at` is set by the public form at creation and by a
     * human pressing Start on a case. NULL means nobody has chosen to contact
     * this family, and nothing here will.
     *
     * A lead switched on mid-funnel resumes from its CURRENT stage, because
     * `currentWaits` derives the wait from `lead_stage` rather than replaying
     * the process from the beginning. That is deliberate: most families a human
     * starts are already halfway through.
     */
    supabase
      .from("admissions_leads")
      .select("id, school_id, lead_stage, guardian_email, automation_started_at, created_at")
      .not("automation_started_at", "is", null),
    supabase
      .from("admissions_parent_reminders")
      .select("id, lead_id, wait_key, waiting_since, reminders_sent, last_reminded_at")
      .is("resolved_at", null)
      .is("escalated_at", null),
    supabase
      .from("admissions_communication_templates")
      .select("id, school_id, template_key, trigger_event, channel, is_active"),
  ]);

  if (leadsResult.error) {
    return {
      opened: 0, resolved: 0, remindersSent: 0, escalated: 0, skippedNoEmail: 0,
      errors: [`Could not read leads: ${leadsResult.error.message}`],
    };
  }
  if (openResult.error) {
    return {
      opened: 0, resolved: 0, remindersSent: 0, escalated: 0, skippedNoEmail: 0,
      errors: [`Could not read open reminders: ${openResult.error.message}`],
    };
  }
  if (templatesResult.error) {
    return {
      opened: 0, resolved: 0, remindersSent: 0, escalated: 0, skippedNoEmail: 0,
      errors: [`Could not read templates: ${templatesResult.error.message}`],
    };
  }

  const leads = (leadsResult.data ?? []) as LeadRow[];
  const leadById = new Map(leads.map((l) => [l.id, l]));
  const openRows = (openResult.data ?? []) as OpenReminderRow[];

  const templatesBySchool = new Map<
    string,
    Map<string, { id: string; trigger_event: string; channel: string }>
  >();
  for (const t of templatesResult.data ?? []) {
    if (!t.is_active) continue;
    const schoolId = t.school_id as string;
    const forSchool = templatesBySchool.get(schoolId) ?? new Map();
    forSchool.set(t.template_key as string, {
      id: t.id as string,
      trigger_event: t.trigger_event as string,
      channel: t.channel as string,
    });
    templatesBySchool.set(schoolId, forSchool);
  }

  let waits: Map<ParentWaitKey, Set<string>>;
  try {
    waits = await currentWaits(supabase, leads);
  } catch (e) {
    return {
      opened: 0, resolved: 0, remindersSent: 0, escalated: 0, skippedNoEmail: 0,
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }

  const openByKey = new Map<string, OpenReminderRow>();
  for (const row of openRows) openByKey.set(`${row.lead_id}:${row.wait_key}`, row);

  // --- 1. Close anything the family has since done. Before sending, so a
  //        family who acted yesterday cannot be chased tonight.
  for (const row of openRows) {
    const stillWaiting = waits.get(row.wait_key as ParentWaitKey)?.has(row.lead_id) ?? false;
    if (stillWaiting) continue;

    const lead = leadById.get(row.lead_id);
    const resolution = lead && TERMINAL_STAGES.has(lead.lead_stage ?? "")
      ? "stage_moved"
      : "completed";

    const { error } = await supabase
      .from("admissions_parent_reminders")
      .update({ resolved_at: new Date().toISOString(), resolution, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) errors.push(`resolve ${row.id}: ${error.message}`);
    else resolved += 1;
  }

  // --- 2. Open a row for anything newly being waited on.
  //        waiting_since is NOW, never the stage date. 111 families have been
  //        parked for months; backdating would fire three reminders and an
  //        escalation at all of them on the first night.
  const nowIso = new Date().toISOString();
  /* Named for its unit: `now` is already taken further down, in step 3. */
  const nowMs = Date.now();
  for (const [waitKey, leadIds] of waits) {
    for (const leadId of leadIds) {
      if (openByKey.has(`${leadId}:${waitKey}`)) continue;

      /*
       * THE ONE WAIT THAT IS BACKDATED, AND WHY THE RULE ABOVE DOES NOT
       * APPLY TO IT.
       *
       * This job runs once a day, at midnight UTC - 8pm Eastern. For the
       * four family waits, opening at `now` is right: they are reached from
       * a gate a human answered, and 111 leads have been parked since
       * February, so backdating would have fired three reminders and an
       * escalation at all of them on the first night.
       *
       * interest_link_not_sent is the opposite case. It opens because an
       * inquiry arrived and nobody has written back, and the inquiry is
       * hours old, not months. Dating it `now` means a family who inquires
       * at nine in the evening has their row opened at 8pm the FOLLOWING
       * day, so the "24 hour" reminder lands nearly 48 hours after they
       * wrote to us - with the family hearing nothing the whole time, which
       * since migration 489 is literally true.
       *
       * So the clock starts when the family inquired. The one-day guard is
       * the old rule, kept: a lead older than that which still has no letter
       * is a backlog item, not a fresh inquiry, and is treated as new so it
       * gets one reminder rather than the whole sequence at once.
       */
      const createdAt = leadById.get(leadId)?.created_at ?? null;
      const createdMs = createdAt ? new Date(createdAt).getTime() : NaN;
      const freshEnough =
        Number.isFinite(createdMs) && nowMs - createdMs < 24 * HOUR_MS;
      const openedAt =
        waitKey === "interest_link_not_sent" && freshEnough && createdAt
          ? createdAt
          : nowIso;

      const { error } = await supabase.from("admissions_parent_reminders").insert({
        lead_id: leadId,
        wait_key: waitKey,
        waiting_since: openedAt,
        reminders_sent: 0,
      });
      // A unique violation here means a resolved row already exists for this
      // pair — the family did the thing, then fell back out of it. Not an
      // error worth waking anyone for, but not silently ignored either.
      if (error) {
        if (!error.message.includes("duplicate key")) {
          errors.push(`open ${leadId}/${waitKey}: ${error.message}`);
        }
        continue;
      }
      opened += 1;
    }
  }

  // --- 3. Send what is due. At most one message per row per run.
  const now = Date.now();
  for (const row of openRows) {
    const stillWaiting = waits.get(row.wait_key as ParentWaitKey)?.has(row.lead_id) ?? false;
    if (!stillWaiting) continue;

    const waitKey = row.wait_key as ParentWaitKey;
    const schedule = SCHEDULE[waitKey];
    /* An unknown wait_key is data this code does not understand. Say so. */
    if (!schedule) {
      errors.push(`unknown wait ${row.wait_key} on ${row.id}`);
      continue;
    }

    /*
     * reminders_sent is the index into the schedule: none sent yet means
     * reminder 1 is due at reminders[0], and all three sent means the
     * escalation is due at escalateAt.
     */
    const openedAt = new Date(row.waiting_since).getTime();
    const dueHours =
      row.reminders_sent >= schedule.reminders.length
        ? schedule.escalateAt
        : schedule.reminders[row.reminders_sent];
    if (now < openedAt + dueHours * HOUR_MS) continue;

    const lead = leadById.get(row.lead_id);
    if (!lead) continue;

    if (row.reminders_sent >= schedule.reminders.length) {
      // Three reminders, no answer. Hand it to a person, with the phone number
      // in the email so they do not have to go and find it.
      const templateKey = ESCALATION_TEMPLATE_KEY[waitKey];
      const token = WAITS_WITH_BUTTONS.has(waitKey)
        ? await mintApplicationCallToken(supabase, row.lead_id)
        : null;

      /*
       * A LETTER WHOSE ONLY BUTTON IS DEAD IS WORSE THAN NO LETTER.
       *
       * The gate takes the same line when the application token cannot be
       * minted: report it and send nothing, so nobody is handed a link that
       * goes nowhere at seven in the morning.
       */
      if (WAITS_WITH_BUTTONS.has(waitKey) && !token) {
        errors.push(
          `could not mint a call link for ${row.lead_id}; escalation not sent`
        );
        continue;
      }

      const sent = await enqueue(supabase, {
        leadId: row.lead_id,
        schoolId: lead.school_id,
        templateKey,
        templatesBySchool,
        mergeOverrides: token ? { applicationCallToken: token } : null,
      });
      if (!sent) {
        errors.push(`no ${templateKey} template for school ${lead.school_id}`);
        continue;
      }
      const { error } = await supabase
        .from("admissions_parent_reminders")
        .update({ escalated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) errors.push(`escalate ${row.id}: ${error.message}`);
      else escalated += 1;
      continue;
    }

    // No address, no email. Counted, because a family nobody can reach is a
    // thing to fix, not a row to skip quietly. It does not apply to a wait
    // addressed to a school leader - she is reachable whatever the family
    // did or did not type into the form.
    if (
      !STAFF_WAITS.has(waitKey) &&
      (!lead.guardian_email || !lead.guardian_email.includes("@"))
    ) {
      skippedNoEmail += 1;
      continue;
    }

    const sent = await enqueue(supabase, {
      leadId: row.lead_id,
      schoolId: lead.school_id,
      templateKey: WAIT_TEMPLATE_KEY[waitKey],
      templatesBySchool,
    });
    if (!sent) {
      errors.push(
        `no ${WAIT_TEMPLATE_KEY[waitKey]} template for school ${lead.school_id}`
      );
      continue;
    }

    const { error } = await supabase
      .from("admissions_parent_reminders")
      .update({
        reminders_sent: row.reminders_sent + 1,
        last_reminded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) errors.push(`increment ${row.id}: ${error.message}`);
    else remindersSent += 1;
  }

  return { opened, resolved, remindersSent, escalated, skippedNoEmail, errors };
}
