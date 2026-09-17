import {
  getAllowedPipelineTransitions,
  getPipelineStageAutomatedTask,
  pipelineStageLabel,
  resolveLegacyLeadStagesForPipelineStage,
  resolvePipelineStageFromLeadStage,
} from "@/lib/admissions/registry";
import { getCaseDerivedRelationships, getCaseWorkflowState } from "@/lib/admissions/case/orchestration";
import { listProspectInviteCandidates } from "@/lib/admissions/portal/prospect-invites";
import { getEntityActivity } from "@/lib/platform/activity";
import { getEntityNotes } from "@/lib/platform/notes";
import { getRelationshipsFrom } from "@/lib/platform/relationships";
import { getEntityTags } from "@/lib/platform/tags";
import type { ProfileEnvelopeBase, ProfileSectionDefinition } from "@/lib/platform/profile/types";
import type { AdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function caseEnvelope(envelope: ProfileEnvelopeBase): AdmissionsCaseProfileEnvelope | null {
  return isAdmissionsCaseProfileEnvelope(envelope) ? envelope : null;
}

function section(partial: ProfileSectionDefinition): ProfileSectionDefinition {
  return partial;
}

async function loadLeadRecord(supabase: AuthClient, leadId: string) {
  const { data } = await supabase
    .from("admissions_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  return data;
}

/**
 * Question labels out of a form version's `definition` jsonb.
 *
 * The definition's shape is owned by the interest-form builder and has changed
 * across versions v1 to v20, so this walks it rather than assuming a path,
 * collecting any object that carries both an identifier and a label. Anything
 * it does not find falls back to humanising the question_key, which is plain
 * rather than wrong - "student_greatness" reads as "Student greatness".
 */
export function extractQuestionLabels(definition: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const seen = new Set<unknown>();

  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const rec = node as Record<string, unknown>;
    const key = rec.key ?? rec.question_key ?? rec.id;
    const label = rec.label ?? rec.question ?? rec.title ?? rec.prompt;
    if (typeof key === "string" && typeof label === "string" && label.trim()) {
      out[key] = label.trim();
    }
    for (const value of Object.values(rec)) walk(value);
  };

  walk(definition);
  return out;
}

/** Admissions Case profile sections — workflow container over existing lead entities. */
export const ADMISSIONS_CASE_PROFILE_SECTIONS: ProfileSectionDefinition[] = [
  section({
    key: "overview",
    label: "Overview",
    group: null,
    pinned: true,
    sortOrder: 0,
    moduleKey: "admissions",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const lead = await loadLeadRecord(supabase, env.leadId);
      if (!lead) return null;
      const workflow = getCaseWorkflowState(lead);
      const [tasks, applications, duplicates, tags] = await Promise.all([
        supabase
          .from("admissions_tasks")
          .select("id", { count: "exact", head: true })
          .eq("lead_id", env.leadId)
          .eq("task_status", "open"),
        supabase.from("admissions_applications").select("id, application_status").eq("lead_id", env.leadId),
        import("@/lib/admissions/duplicates").then((m) =>
          m.detectDuplicates({
            firstName: lead.first_name,
            lastName: lead.last_name,
            guardianEmail: lead.guardian_email,
            guardianPhone: lead.guardian_phone,
            dateOfBirth: lead.date_of_birth,
            excludeLeadId: env.leadId,
          })
        ),
        env.organizationId ? getEntityTags(supabase, "admissions_lead", env.leadId) : Promise.resolve([]),
      ]);
      return {
        lead,
        workflow,
        openTaskCount: tasks.count ?? 0,
        applications: applications.data ?? [],
        duplicates,
        tags,
      };
    },
  }),
  section({
    key: "prospect",
    label: "Prospective Family",
    group: "relationships",
    sortOrder: 10,
    moduleKey: "admissions",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const [lead, guardians, inviteCandidates] = await Promise.all([
        loadLeadRecord(supabase, env.leadId),
        supabase.from("admissions_lead_guardians").select("*").eq("lead_id", env.leadId),
        // Who on this enquiry can be given portal access, and why anybody
        // cannot. Loaded here rather than in the component because it checks
        // `public.users` for existing accounts, which needs the service role.
        listProspectInviteCandidates(env.leadId),
      ]);
      return { lead, guardians: guardians.data ?? [], inviteCandidates, leadId: env.leadId };
    },
  }),
  section({
    /**
     * THE FAMILY'S OWN WORDS.
     *
     * Added 17 September 2026. Until then there was nowhere in JAG to read a
     * family's inquiry form. The answers have been stored since migration 223
     * and exactly one function read them - getInquiryHighlights - which returns
     * two of them and feeds only the Decisions screen. So what a family wrote
     * about their child was visible while a decision was open and disappeared
     * the moment somebody answered it.
     *
     * The same for `admissions_leads.notes`: the September import wrote every
     * family's GREATNESS and challenges into that column for 300-odd children,
     * Overview loads the lead with select("*"), and nothing renders it. The
     * Notes tab reads `admissions_notes`, a different table. This section shows
     * both.
     *
     * SERVICE ROLE, DELIBERATELY. carry-forward.ts documents why: the interest
     * tables are written by the service role and are unreadable to a parent's
     * own session, so a staff read through the auth client can come back empty
     * and look exactly like a family who never filled the form in. The
     * authorization boundary is the CASE - the page already proved this viewer
     * may open this lead, and loadActiveSectionData now checks this section's
     * permissions before calling this function - so scoping the read to that
     * one lead_id is the right grain.
     *
     * Not money, so ordinary admissions permissions.
     */
    key: "interest_form",
    label: "Interest Form",
    group: "relationships",
    sortOrder: 12,
    moduleKey: "admissions",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;

      // The lead's own notes column, through the caller's client - the lead is
      // already inside this viewer's reach.
      const { data: lead } = await supabase
        .from("admissions_leads")
        .select("notes")
        .eq("id", env.leadId)
        .maybeSingle();
      const leadNotes = (lead as { notes?: string | null } | null)?.notes ?? null;

      const admin = createServiceRoleClient();

      const { data: submission, error: subError } = await admin
        .from("admissions_interest_submissions" as never)
        .select("id, submitted_at, form_version_id")
        .eq("lead_id", env.leadId)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Checked, not assumed. An error and an empty form are different facts
      // and the component says so rather than reporting silence as absence.
      if (subError) {
        return { submittedAt: null, answers: [], labels: {}, leadNotes, unavailable: subError.message };
      }

      const sub = submission as
        | { id?: string; submitted_at?: string; form_version_id?: string }
        | null;
      if (!sub?.id) {
        return { submittedAt: null, answers: [], labels: {}, leadNotes, unavailable: null };
      }

      const [answersResult, versionResult] = await Promise.all([
        admin
          .from("admissions_interest_answers" as never)
          .select("question_key, value")
          .eq("submission_id", sub.id),
        sub.form_version_id
          ? admin
              .from("admissions_interest_form_versions" as never)
              .select("definition")
              .eq("id", sub.form_version_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (answersResult.error) {
        return {
          submittedAt: sub.submitted_at ?? null,
          answers: [],
          labels: {},
          leadNotes,
          unavailable: answersResult.error.message,
        };
      }

      return {
        submittedAt: sub.submitted_at ?? null,
        answers: (answersResult.data ?? []) as { question_key: string; value: unknown }[],
        labels: extractQuestionLabels(
          (versionResult.data as { definition?: unknown } | null)?.definition
        ),
        leadNotes,
        unavailable: null,
      };
    },
  }),
  section({
    key: "pipeline",
    label: "Pipeline",
    group: "operations",
    sortOrder: 20,
    moduleKey: "admissions",
    permissions: ["admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const lead = await loadLeadRecord(supabase, env.leadId);
      if (!lead) return null;
      const [history, workflow] = await Promise.all([
        supabase
          .from("admissions_lead_stage_history")
          .select("*, users(full_name)")
          .eq("lead_id", env.leadId)
          .order("changed_at", { ascending: false }),
        Promise.resolve(getCaseWorkflowState(lead)),
      ]);
      return { lead, stageHistory: history.data ?? [], workflow };
    },
  }),
  section({
    key: "applications",
    label: "Applications",
    group: "operations",
    sortOrder: 30,
    moduleKey: "admissions",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const { getLeadApplicationsForStaff } = await import("@/lib/admissions/portal/queries");
      const applications = await getLeadApplicationsForStaff(env.leadId);
      const primary = applications[0];
      const checklist = primary
        ? await import("@/lib/admissions/checklist").then((m) =>
            m.getApplicationChecklist(primary.id)
          )
        : null;
      return { applications, checklist, primaryApplicationId: primary?.id ?? null };
    },
  }),
  section({
    key: "documents",
    label: "Documents",
    group: "operations",
    sortOrder: 40,
    moduleKey: "admissions",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const { data: applications } = await supabase
        .from("admissions_applications")
        .select("id")
        .eq("lead_id", env.leadId)
        .limit(1);
      const appId = applications?.[0]?.id;
      if (!appId) return { items: [], percentComplete: 0 };
      const checklist = await import("@/lib/admissions/checklist").then((m) =>
        m.getApplicationChecklist(appId)
      );
      return checklist;
    },
  }),
  section({
    key: "visits",
    label: "Tours & Interviews",
    group: "operations",
    sortOrder: 50,
    moduleKey: "admissions",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const [tours, interviews] = await Promise.all([
        supabase.from("admissions_tours").select("*").eq("lead_id", env.leadId).order("scheduled_at"),
        supabase.from("admissions_interviews").select("*").eq("lead_id", env.leadId).order("scheduled_at"),
      ]);
      return { tours: tours.data ?? [], interviews: interviews.data ?? [] };
    },
  }),
  section({
    key: "communications",
    label: "Communications",
    group: "communication",
    sortOrder: 60,
    moduleKey: "admissions",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const { getApplicantTimeline, getLeadCommunications, getPendingQueue } = await import(
        "@/lib/admissions/communications/queries"
      );
      const { data: applications } = await supabase
        .from("admissions_applications")
        .select("id")
        .eq("lead_id", env.leadId)
        .limit(1);
      const applicationId = applications?.[0]?.id ?? null;
      const [timeline, communications, pendingQueue, lead] = await Promise.all([
        getApplicantTimeline(env.leadId),
        getLeadCommunications(env.leadId),
        getPendingQueue(env.leadId),
        loadLeadRecord(supabase, env.leadId),
      ]);
      return { timeline, communications, pendingQueue, applicationId, guardianEmail: lead?.guardian_email };
    },
  }),
  section({
    key: "tasks",
    label: "Tasks",
    group: "operations",
    sortOrder: 70,
    moduleKey: "admissions",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const { getLeadTasks } = await import("@/lib/admissions/queries");
      return { tasks: await getLeadTasks(env.leadId) };
    },
  }),
  section({
    key: "student_questionnaire",
    label: "Student Questionnaire",
    group: "relationships",
    sortOrder: 15,
    moduleKey: "admissions",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    /**
     * The high school's five questions, answered by the student from their own
     * emailed link rather than over their parent's shoulder. Rows exist only
     * for leads that were asked, so every other campus renders nothing.
     *
     * `as never` on the table name: migration 340 is hand-run, so the generated
     * database types do not know this table. Naming only this query keeps every
     * other query in the file type-checked.
     */
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const { data, error } = await supabase
        .from("admissions_student_questionnaires" as never)
        .select(
          "id, student_email, status, answers, sent_at, opened_at, completed_at, expires_at"
        )
        .eq("lead_id", env.leadId)
        .order("sent_at", { ascending: false });

      if (error) {
        console.error("[admissions-case] student questionnaires", error.message);
        return null;
      }
      return { questionnaires: data ?? [] };
    },
  }),
  section({
    /**
     * MONEY. ASKED THE RIGHT QUESTION AS OF 16 SEPTEMBER 2026.
     *
     * This section renders, for every child, in formatted currency:
     * the requested scholarship amount, the approved amount, and the family's
     * HOUSEHOLD INCOME - plus an approve/decline control.
     *
     * It required ["admissions.view", "admissions.manage", "admissions.accept"],
     * and section permissions are ANY-OF (userHasAnyPermission in
     * platform/profile/access.ts). Heather Badger-Brown and Nina Gaddy hold all
     * three. So every School Leader could read every family's household income,
     * on every child's card.
     *
     * Migrations 349, 357 and 358 denied SCHOOL_LEADER every key matching
     * fund/scholarship/financ/tuition. Those denies were real and they worked -
     * on the pages under /dashboard/admissions/state-funding. This section asked
     * for none of those keys, so nothing they denied was ever consulted. A guard
     * that exists and is asked the wrong question is the same shape as Heather
     * being shown a Florida family: the security was not broken, it was
     * answering a question nobody meant to ask.
     *
     * Now it requires a MONEY key. Deliberately the same set the funding pages
     * use (FUNDING_ANY_OF in AdmissionsPageContent.tsx) plus the scholarship
     * keys, so one rule covers the pages and the card and they cannot drift.
     * Jimmy holds everything as FOUNDER; Danni's CEO role carries
     * scholarships.view. School Leaders hold none of them, by three migrations
     * that meant exactly this.
     */
    key: "scholarships",
    label: "Scholarships & Funding",
    group: "financial",
    sortOrder: 80,
    moduleKey: "admissions",
    permissions: [
      "funding.view",
      "funding.verify",
      "finance.state_funding",
      "finance.view",
      "scholarships.view",
      "scholarships.approve",
    ],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const { data: applications } = await supabase
        .from("admissions_applications")
        .select("id")
        .eq("lead_id", env.leadId);
      const appIds = applications?.map((a) => a.id) ?? [];
      const [verifications, scholarships] = await Promise.all([
        appIds.length
          ? supabase.from("state_funding_verifications").select("*").in("application_id", appIds)
          : Promise.resolve({ data: [] }),
        appIds.length
          ? supabase.from("scholarship_applications").select("*").in("application_id", appIds)
          : Promise.resolve({ data: [] }),
      ]);
      return {
        verifications: verifications.data ?? [],
        scholarships: scholarships.data ?? [],
        applicationIds: appIds,
      };
    },
  }),
  section({
    key: "decisions",
    label: "Decisions",
    group: "operations",
    sortOrder: 90,
    moduleKey: "admissions",
    permissions: ["admissions.accept", "admissions.manage"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const lead = await loadLeadRecord(supabase, env.leadId);
      const [decisions, applications] = await Promise.all([
        supabase.from("admissions_decisions").select("*").eq("lead_id", env.leadId).order("created_at", { ascending: false }),
        supabase.from("admissions_applications").select("id").eq("lead_id", env.leadId).limit(1),
      ]);
      return {
        decisions: decisions.data ?? [],
        applicationId: applications.data?.[0]?.id ?? null,
        studentName: lead ? `${lead.first_name} ${lead.last_name}` : env.displayName,
      };
    },
  }),
  section({
    key: "enrollment",
    label: "Enrollment",
    group: "operations",
    sortOrder: 100,
    moduleKey: "admissions",
    permissions: ["admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const lead = await loadLeadRecord(supabase, env.leadId);
      const { data: applications } = await supabase
        .from("admissions_applications")
        .select("id")
        .eq("lead_id", env.leadId)
        .limit(1);
      const applicationId = applications?.[0]?.id ?? null;
      const [packet, studentResult] = await Promise.all([
        applicationId
          ? import("@/lib/admissions/enrollment-packets").then((m) =>
              m.getEnrollmentPacket(applicationId)
            )
          : Promise.resolve(null),
        supabase
          .from("students")
          .select("id")
          .eq("admissions_lead_id", env.leadId)
          .maybeSingle(),
      ]);
      return {
        packet,
        applicationId,
        leadId: env.leadId,
        signerEmail: lead?.guardian_email ?? "",
        studentId: studentResult.data?.id ?? null,
      };
    },
  }),
  section({
    key: "notes",
    label: "Notes",
    group: "communication",
    sortOrder: 110,
    moduleKey: "platform",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const [platformNotes, legacyNotes] = await Promise.all([
        getEntityNotes(supabase, "admissions_lead", env.leadId, { pinnedFirst: true }),
        supabase
          .from("admissions_notes")
          .select("*, users(full_name)")
          .eq("lead_id", env.leadId)
          .order("created_at", { ascending: false }),
      ]);
      return { platformNotes, legacyNotes: legacyNotes.data ?? [] };
    },
  }),
  section({
    key: "activity",
    label: "Activity",
    group: "communication",
    sortOrder: 120,
    moduleKey: "platform",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const [activity, stageHistory, audit] = await Promise.all([
        getEntityActivity(supabase, "admissions_lead", env.leadId),
        supabase
          .from("admissions_lead_stage_history")
          .select("*, users(full_name)")
          .eq("lead_id", env.leadId)
          .order("changed_at", { ascending: false }),
        import("@/lib/admissions/automation/queries").then((m) =>
          m.getStaffAuditTimeline(env.leadId)
        ),
      ]);
      return {
        activity,
        stageHistory: stageHistory.data ?? [],
        audit,
      };
    },
  }),
  section({
    key: "relationships",
    label: "Relationships",
    group: "relationships",
    sortOrder: 130,
    moduleKey: "platform",
    permissions: ["admissions.view", "admissions.manage", "admissions.accept"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = caseEnvelope(envelope);
      if (!env) return null;
      const [platformRelationships, derived] = await Promise.all([
        getRelationshipsFrom(supabase, "admissions_lead", env.leadId),
        getCaseDerivedRelationships(supabase, env.leadId),
      ]);
      return { platformRelationships, derived };
    },
  }),
];

export const ADMISSIONS_CASE_PROFILE_SECTION_COUNT = ADMISSIONS_CASE_PROFILE_SECTIONS.length;

export {
  getAllowedPipelineTransitions,
  resolveLegacyLeadStagesForPipelineStage,
  resolvePipelineStageFromLeadStage,
  pipelineStageLabel,
  getPipelineStageAutomatedTask,
};
