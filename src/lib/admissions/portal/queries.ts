import { createAuthClient } from "@/lib/supabase/server-auth";
import { fetchLeadFundingCodesByLeadIds } from "@/lib/funding/sync";

export interface PortalApplication {
  id: string;
  lead_id: string;
  school_year_id: string;
  application_date: string;
  application_status: string;
  admissions_decision_date: string | null;
  previous_school: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  learning_needs_summary: string | null;
  submitted_at: string | null;
  lead_stage: string;
  admissions_leads?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    program: string | null;
    guardian_email: string | null;
    lead_stage: string;
    schools?: { name: string } | null;
  } | null;
  school_years?: { name: string } | null;
}

export interface PortalApplicationDocument {
  id: string;
  application_id: string;
  document_type: string;
  document_subtype: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  document_status: string;
  created_at: string;
}

export interface PortalStateFundingVerification {
  id: string;
  application_id: string;
  funding_source_code: string;
  state_program_id: string | null;
  verification_status: string;
  verified_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
}

export interface PortalScholarshipApplication {
  id: string;
  application_id: string;
  requested_amount: number | null;
  household_income: number | null;
  scholarship_status: string;
  submitted_at: string | null;
}

export interface PortalScholarshipDocument {
  id: string;
  scholarship_application_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  created_at: string;
}

export interface GuardianPortalLead {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  lead_stage: string;
  program: string | null;
  funding_sources: string[];
  schools?: { name: string } | null;
  applications: PortalApplication[];
}

const APPLICATION_SELECT = `
  *,
  admissions_leads(
    id,
    first_name,
    last_name,
    preferred_name,
    program,
    guardian_email,
    lead_stage,
    schools(name)
  ),
  school_years(name)
`;

export async function getSchoolsForInquiry() {
  // Organization-scoped public school list (admissions_interest_public only).
  const { resolveInterestFormOrganization } = await import(
    "@/lib/admissions/interest-form/org-resolve"
  );
  const { listPublicSchoolsForOrganization } = await import(
    "@/lib/admissions/interest-form/load"
  );
  const org = await resolveInterestFormOrganization();
  if (!org) return [];
  return listPublicSchoolsForOrganization(org.organizationId);
}

export type CurrentSchoolYear = { id: string; name: string } | null;

/**
 * The row that decides whether a family can begin.
 *
 * Start Application is disabled without a current school year, so this one read
 * stands between a family and the application they were invited to make. Until
 * 13 September it was written `const { data } = await …` and returned `data`,
 * which meant three different worlds arrived as the same `null`:
 *
 *   - there is no current year for this campus          (a data problem)
 *   - the caller may not read school_years              (a policy problem)
 *   - there is more than one current year, so
 *     maybeSingle() returns an ERROR rather than a row  (a data problem that
 *                                                        looks like neither)
 *
 * All three disabled the button and said "School year unavailable", which is
 * true of the first and a lie about the other two. Migration 351 fixed the
 * policy problem for prospective guardians; this makes the next one visible
 * instead of leaving the family staring at a dead button.
 */
export type CurrentSchoolYearResult =
  | { ok: true; year: CurrentSchoolYear }
  | { ok: false };

export async function getCurrentSchoolYear(
  schoolId: string
): Promise<CurrentSchoolYearResult> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("school_years")
    .select("id, name")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    console.error(
      `[apply/portal] current school year read failed for school ${schoolId}`,
      error.message
    );
    return { ok: false };
  }

  return { ok: true, year: (data as CurrentSchoolYear) ?? null };
}

/**
 * What the portal found, or why it could not look.
 *
 * WHY THIS IS NOT JUST AN ARRAY. Until 13 September 2026 this function returned
 * `GuardianPortalLead[]`, and every one of its five reads was written
 * `const { data } = await …` — the `error` destructured into nothing. A read
 * that failed produced `undefined`, `?? []` turned that into an empty array,
 * and the page rendered "No inquiries found".
 *
 * On 12 September Lana Robinson followed her invitation, set a password, landed
 * here, and was told there were no inquiries. There was one. Every read in this
 * function was dying with `54001 stack depth limit exceeded`, because three RLS
 * helper functions were SECURITY INVOKER and read the tables whose policies
 * called them (fixed in migration 350). The database was screaming and the
 * screen said everything was fine.
 *
 * An empty result and a failed result are different facts about the world, and
 * a family deciding whether to fill the form in a second time needs to know
 * which one they are looking at. So the caller is made to handle both.
 */
export type GuardianPortalResult =
  | { ok: true; leads: GuardianPortalLead[] }
  | { ok: false; message: string };

/** Same message every time: what broke is our business, not the family's. */
const PORTAL_READ_FAILED =
  "We could not load your application just now. Nothing you have submitted is lost.";

export async function getGuardianPortalLeads(
  userEmail: string
): Promise<GuardianPortalResult> {
  const supabase = await createAuthClient();
  const normalizedEmail = userEmail.trim().toLowerCase();

  const { data: guardianLinks, error: guardianLinksError } = await supabase
    .from("admissions_lead_guardians")
    .select("lead_id")
    .ilike("email", normalizedEmail);

  if (guardianLinksError) {
    console.error("[apply/portal] guardian link read failed", guardianLinksError.message);
    return { ok: false, message: PORTAL_READ_FAILED };
  }

  const leadIdsFromGuardians = guardianLinks?.map((g) => g.lead_id) ?? [];

  const { data: directLeads, error: directLeadsError } = await supabase
    .from("admissions_leads")
    .select("id")
    .ilike("guardian_email", normalizedEmail);

  if (directLeadsError) {
    console.error("[apply/portal] direct lead read failed", directLeadsError.message);
    return { ok: false, message: PORTAL_READ_FAILED };
  }

  const leadIds = [
    ...new Set([
      ...leadIdsFromGuardians,
      ...(directLeads?.map((l) => l.id) ?? []),
    ]),
  ];

  if (leadIds.length === 0) return { ok: true, leads: [] };

  const { data: leads, error: leadsError } = await supabase
    .from("admissions_leads")
    .select("*, schools(name)")
    .in("id", leadIds)
    .order("created_at", { ascending: false });

  if (leadsError) {
    console.error("[apply/portal] lead read failed", leadsError.message);
    return { ok: false, message: PORTAL_READ_FAILED };
  }

  /**
   * Not an error, but not nothing either. The guardian rows named leads that the
   * lead read did not return — which under RLS means those rows are readable by
   * one policy and not the other. Reporting "no inquiries" here would repeat the
   * exact failure this function was rewritten for.
   */
  if (!leads?.length) {
    console.error(
      `[apply/portal] ${leadIds.length} lead id(s) matched this guardian but none could be read`
    );
    return { ok: false, message: PORTAL_READ_FAILED };
  }

  const fundingByLeadId = await fetchLeadFundingCodesByLeadIds(supabase, leadIds);

  const { data: applications, error: applicationsError } = await supabase
    .from("admissions_applications")
    .select(APPLICATION_SELECT)
    .in("lead_id", leadIds)
    .order("created_at", { ascending: false });

  /**
   * This one does not fail the page. The enquiries are real and readable; only
   * the applications attached to them could not be fetched. Showing the child's
   * name with a Start Application button is far better than showing nothing, and
   * the log carries the truth.
   */
  if (applicationsError) {
    console.error("[apply/portal] application read failed", applicationsError.message);
  }

  const appsByLead = (applications ?? []).reduce<Record<string, PortalApplication[]>>(
    (acc, app) => {
      const row = app as PortalApplication;
      const leadStage =
        row.admissions_leads?.lead_stage ?? "new_inquiry";
      const enriched = { ...row, lead_stage: leadStage };
      if (!acc[row.lead_id]) acc[row.lead_id] = [];
      acc[row.lead_id].push(enriched);
      return acc;
    },
    {}
  );

  return {
    ok: true,
    leads: leads.map((lead) => ({
      ...(lead as Omit<GuardianPortalLead, "funding_sources" | "applications">),
      funding_sources: fundingByLeadId.get(lead.id) ?? [],
      applications: appsByLead[lead.id] ?? [],
    })),
  };
}

export async function getPortalApplication(applicationId: string) {
  const supabase = await createAuthClient();

  const { data, error } = await supabase
    .from("admissions_applications")
    .select(APPLICATION_SELECT)
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as PortalApplication;
  const fundingByLeadId = await fetchLeadFundingCodesByLeadIds(supabase, [row.lead_id]);

  return {
    application: {
      ...row,
      lead_stage: row.admissions_leads?.lead_stage ?? "new_inquiry",
    },
    fundingCodes: fundingByLeadId.get(row.lead_id) ?? [],
  };
}

/**
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * READS THAT AN AUTOMATED DECISION DEPENDS ON.
 *
 * These four are loaded together by loadApplicationEvidence below and handed to
 * runAutomatedAcceptanceWorkflow, which decides whether a child is accepted. A
 * read that fails and returns an empty array does not look like a failure at
 * that point — it looks exactly like a family who has uploaded nothing.
 *
 * They used to swallow their errors entirely. On 13 September they were given a
 * console.error and left otherwise alone, because nobody had ever walked these
 * screens as a parent and it was not known whether a parent could read these
 * tables at all. Asking production on 14 September settled it: every one of
 * these tables has a guardian SELECT policy, and all of them rest on
 * is_guardian_of_lead — which was SECURITY INVOKER, and therefore recursing,
 * until migration 350. The reads should work now.
 *
 * "Should" is not a basis for an admissions decision, so each one now reports
 * whether it failed, and every caller is made to look.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** A read that knows whether it worked. `failed` is never silently discarded. */
export type PortalRead<T> = { data: T; failed: boolean };

export async function getApplicationDocuments(
  applicationId: string
): Promise<PortalRead<PortalApplicationDocument[]>> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("application_documents")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      `[apply/portal] application documents read failed for ${applicationId}`,
      error.message
    );
  }

  return { data: (data ?? []) as PortalApplicationDocument[], failed: Boolean(error) };
}

export async function getStateFundingVerifications(
  applicationId: string
): Promise<PortalRead<PortalStateFundingVerification[]>> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("state_funding_verifications")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      `[apply/portal] state funding verifications read failed for ${applicationId}`,
      error.message
    );
  }

  return {
    data: (data ?? []) as PortalStateFundingVerification[],
    failed: Boolean(error),
  };
}

export async function getScholarshipForApplication(
  applicationId: string
): Promise<PortalRead<PortalScholarshipApplication | null>> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("scholarship_applications")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error) {
    console.error(
      `[apply/portal] scholarship read failed for ${applicationId}`,
      error.message
    );
  }

  return {
    data: (data ?? null) as PortalScholarshipApplication | null,
    failed: Boolean(error),
  };
}

export async function getScholarshipDocuments(
  scholarshipApplicationId: string
): Promise<PortalRead<PortalScholarshipDocument[]>> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("scholarship_documents")
    .select("*")
    .eq("scholarship_application_id", scholarshipApplicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      `[apply/portal] scholarship documents read failed for ${scholarshipApplicationId}`,
      error.message
    );
  }

  return { data: (data ?? []) as PortalScholarshipDocument[], failed: Boolean(error) };
}

export async function getLeadApplicationsForStaff(leadId: string) {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("admissions_applications")
    .select(APPLICATION_SELECT)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      `[admissions] staff application list read failed for lead ${leadId}`,
      error.message
    );
  }

  return (data ?? []) as PortalApplication[];
}

/**
 * Everything the acceptance workflow and the progress bar are computed from,
 * loaded together, with the failures kept.
 *
 * WHY IT IS ONE FUNCTION. These four reads were made in three places
 * (submitApplication, the post-submit hook, runStaffAcceptanceCheck) and on the
 * application page, each time as four separate calls whose errors were dropped
 * on the floor. Four chances per site to quietly turn "we could not read this"
 * into "this family uploaded nothing" — and then hand that to something that
 * decides whether a child is accepted.
 *
 * Loading them together means there is exactly one place that knows whether the
 * evidence is complete, and `failedReads` cannot be destructured away by
 * accident the way a discarded `error` could.
 *
 * WHAT A CALLER MUST DO. If `failedReads` is not empty, the data below is not
 * the whole truth and no decision may rest on it. Say so and stop. Do not run
 * the acceptance workflow, do not compute a completion percentage, and do not
 * tell a family what they still have to upload.
 */
export type ApplicationEvidence = {
  documents: PortalApplicationDocument[];
  verifications: PortalStateFundingVerification[];
  scholarship: PortalScholarshipApplication | null;
  scholarshipDocuments: PortalScholarshipDocument[];
  /** Plain names of the reads that failed. Empty means the rest is complete. */
  failedReads: string[];
};

export async function loadApplicationEvidence(
  applicationId: string
): Promise<ApplicationEvidence> {
  const [documents, verifications, scholarship] = await Promise.all([
    getApplicationDocuments(applicationId),
    getStateFundingVerifications(applicationId),
    getScholarshipForApplication(applicationId),
  ]);

  // Only reachable when there is a scholarship to read documents for. A failure
  // to read the scholarship itself is already recorded below, so this is not
  // silently skipped — it is not applicable.
  const scholarshipDocuments = scholarship.data
    ? await getScholarshipDocuments(scholarship.data.id)
    : { data: [] as PortalScholarshipDocument[], failed: false };

  const failedReads = [
    documents.failed ? "documents" : null,
    verifications.failed ? "state funding verifications" : null,
    scholarship.failed ? "scholarship" : null,
    scholarshipDocuments.failed ? "scholarship documents" : null,
  ].filter((name): name is string => name !== null);

  if (failedReads.length) {
    console.error(
      `[apply/portal] application ${applicationId}: could not read ${failedReads.join(", ")}`
    );
  }

  return {
    documents: documents.data,
    verifications: verifications.data,
    scholarship: scholarship.data,
    scholarshipDocuments: scholarshipDocuments.data,
    failedReads,
  };
}
