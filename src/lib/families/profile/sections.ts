import {
  getAuditActivity,
  getEntityActivity,
} from "@/lib/platform/activity";
import { getEntityNotes } from "@/lib/platform/notes";
import {
  getFamilyGuardianRelationships,
  getFamilyStudentRelationships,
} from "@/lib/platform/relationships";
import { getEntityTags } from "@/lib/platform/tags";
import type { ProfileEnvelopeBase, ProfileSectionDefinition } from "@/lib/platform/profile/types";
import type { FamilyProfileEnvelope } from "@/lib/families/profile/types";
import { isFamilyProfileEnvelope } from "@/lib/families/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function familyEnvelope(envelope: ProfileEnvelopeBase): FamilyProfileEnvelope | null {
  return isFamilyProfileEnvelope(envelope) ? envelope : null;
}

function section(partial: ProfileSectionDefinition): ProfileSectionDefinition {
  return partial;
}

async function loadFamilyRecord(supabase: AuthClient, familyId: string) {
  const { data } = await supabase
    .from("families")
    .select("*, schools(name, organization_id)")
    .eq("id", familyId)
    .maybeSingle();
  return data;
}

async function loadFamilyStudents(supabase: AuthClient, familyId: string) {
  const { data } = await supabase
    .from("students")
    .select("id, first_name, last_name, preferred_name, grade_level, program, enrollment_status, lifecycle_stage, student_number")
    .eq("family_id", familyId)
    .order("last_name");
  return data ?? [];
}

async function loadFamilyStudentIds(supabase: AuthClient, familyId: string): Promise<string[]> {
  const students = await loadFamilyStudents(supabase, familyId);
  return students.map((student) => student.id);
}

const CLOSED_ADMISSION_STAGES = ["enrolled", "declined"];

async function loadFamilyOverviewDashboard(
  supabase: AuthClient,
  env: FamilyProfileEnvelope
) {
  const studentIds = await loadFamilyStudentIds(supabase, env.familyId);
  const now = new Date().toISOString();
  const today = now.split("T")[0];
  const alertSince = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    family,
    students,
    studentRelationships,
    guardianRelationships,
    tags,
    guardians,
    financial,
    recentActivity,
    transportationRoutes,
    alertEvents,
  ] = await Promise.all([
    loadFamilyRecord(supabase, env.familyId),
    loadFamilyStudents(supabase, env.familyId),
    getFamilyStudentRelationships(supabase, env.familyId),
    getFamilyGuardianRelationships(supabase, env.familyId),
    env.organizationId
      ? getEntityTags(supabase, "family", env.familyId)
      : Promise.resolve([]),
    import("@/lib/students/queries").then((m) => m.getGuardiansByFamily(env.familyId)),
    import("@/lib/finance/family-center").then((m) =>
      m.getFamilyFinancialProfile(supabase, env.familyId)
    ),
    getEntityActivity(supabase, "family", env.familyId, { limit: 10 }),
    studentIds.length
      ? supabase
          .from("platform_relationships")
          .select("id")
          .eq("from_entity_type", "student")
          .in("from_entity_id", studentIds)
          .eq("relationship_type", "student.transportation_route")
          .eq("status", "active")
      : Promise.resolve({ data: [] }),
    supabase
      .from("platform_activity_events")
      .select("severity")
      .eq("family_id", env.familyId)
      .in("severity", ["warning", "critical"])
      .gte("occurred_at", alertSince),
  ]);

  const leadIdsFromStudents = [
    ...new Set(
      (
        await supabase
          .from("students")
          .select("admissions_lead_id")
          .eq("family_id", env.familyId)
          .not("admissions_lead_id", "is", null)
      ).data?.map((row) => row.admissions_lead_id).filter(Boolean) ?? []
    ),
  ];

  const guardianEmails = [
    ...new Set(
      (guardians ?? [])
        .map((g) => g.email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email))
    ),
  ];

  const [openLeadRes, upcomingMeetingsRes, missingDocsRes] = await Promise.all([
    (async () => {
      const leadIdSet = new Set<string>(leadIdsFromStudents as string[]);
      if (guardianEmails.length) {
        const { data: emailLeads } = await supabase
          .from("admissions_leads")
          .select("id, lead_stage")
          .in("guardian_email", guardianEmails);
        for (const lead of emailLeads ?? []) {
          if (!CLOSED_ADMISSION_STAGES.includes(lead.lead_stage)) {
            leadIdSet.add(lead.id);
          }
        }
      }
      if (!leadIdSet.size) return 0;
      const { data: leads } = await supabase
        .from("admissions_leads")
        .select("id, lead_stage")
        .in("id", [...leadIdSet]);
      return (leads ?? []).filter((lead) => !CLOSED_ADMISSION_STAGES.includes(lead.lead_stage))
        .length;
    })(),
    studentIds.length
      ? supabase
          .from("student_instructional_meetings")
          .select("id, title, scheduled_at, student_id, students(first_name, last_name)")
          .in("student_id", studentIds)
          .gte("scheduled_at", now)
          .order("scheduled_at", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] }),
    (async () => {
      let count = 0;
      if (studentIds.length) {
        const { count: expiredDocs } = await supabase
          .from("student_documents")
          .select("id", { count: "exact", head: true })
          .in("student_id", studentIds)
          .eq("status", "active")
          .lt("expires_at", today);
        count += expiredDocs ?? 0;
      }
      if (leadIdsFromStudents.length) {
        const { data: apps } = await supabase
          .from("admissions_applications")
          .select("id")
          .in("lead_id", leadIdsFromStudents);
        const appIds = apps?.map((app) => app.id) ?? [];
        if (appIds.length) {
          const { count: checklistOpen } = await supabase
            .from("admissions_application_checklist_items")
            .select("id", { count: "exact", head: true })
            .in("application_id", appIds)
            .neq("status", "complete");
          count += checklistOpen ?? 0;
        }
      }
      return count;
    })(),
  ]);

  const alertRows = alertEvents.data ?? [];
  const tuitionBalance = Number(financial?.account?.balance ?? 0);
  const scholarshipCount = financial?.scholarships?.length ?? 0;

  return {
    family,
    students,
    guardians: guardians ?? [],
    studentRelationships,
    guardianRelationships,
    tags,
    metrics: {
      studentCount: students.length,
      guardianCount: guardians?.length ?? 0,
      tuitionBalance,
      scholarshipCount,
      openAdmissions: openLeadRes,
      missingDocuments: missingDocsRes,
      upcomingMeetings: upcomingMeetingsRes.data?.length ?? 0,
      transportationRoutes: transportationRoutes.data?.length ?? 0,
      alertCount: alertRows.length,
      criticalAlerts: alertRows.filter((row) => row.severity === "critical").length,
    },
    upcomingMeetingsList: upcomingMeetingsRes.data ?? [],
    recentActivity,
  };
}

/** Family profile section definitions — registered via Platform Profile Registry. */
export const FAMILY_PROFILE_SECTIONS: ProfileSectionDefinition[] = [
  section({
    key: "overview",
    label: "Overview",
    group: null,
    pinned: true,
    sortOrder: 0,
    moduleKey: "platform",
    permissions: ["students.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      return loadFamilyOverviewDashboard(supabase, env);
    },
  }),
  section({
    key: "household",
    label: "Household",
    group: "relationships",
    sortOrder: 10,
    moduleKey: "ssis",
    permissions: ["students.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const { getFamilyHouseholds } = await import("@/lib/ssis/family");
      const [family, households] = await Promise.all([
        loadFamilyRecord(supabase, env.familyId),
        getFamilyHouseholds(env.familyId),
      ]);
      return { family, households };
    },
  }),
  section({
    key: "parents-guardians",
    label: "Parents / Guardians",
    group: "relationships",
    sortOrder: 20,
    moduleKey: "ssis",
    permissions: ["students.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const { getGuardiansByFamily } = await import("@/lib/students/queries");
      const [guardians, relationships] = await Promise.all([
        getGuardiansByFamily(env.familyId),
        getFamilyGuardianRelationships(supabase, env.familyId),
      ]);
      return { guardians, relationships };
    },
  }),
  section({
    key: "students",
    label: "Students",
    group: "relationships",
    sortOrder: 30,
    moduleKey: "sis",
    permissions: ["students.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const [students, relationships] = await Promise.all([
        loadFamilyStudents(supabase, env.familyId),
        getFamilyStudentRelationships(supabase, env.familyId),
      ]);
      return { students, relationships };
    },
  }),
  section({
    key: "emergency-contacts",
    label: "Emergency Contacts",
    group: "support",
    sortOrder: 40,
    moduleKey: "ssis",
    permissions: ["students.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const studentIds = await loadFamilyStudentIds(supabase, env.familyId);
      if (!studentIds.length) return { contacts: [] };
      const { data } = await supabase
        .from("student_authorized_contacts")
        .select("*, students(first_name, last_name)")
        .in("student_id", studentIds)
        .eq("is_emergency_contact", true)
        .eq("is_active", true);
      return { contacts: data ?? [] };
    },
  }),
  section({
    key: "authorized-pickup",
    label: "Authorized Pickup",
    group: "support",
    sortOrder: 50,
    moduleKey: "ssis",
    permissions: ["students.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const studentIds = await loadFamilyStudentIds(supabase, env.familyId);
      if (!studentIds.length) return { contacts: [] };
      const { data } = await supabase
        .from("student_authorized_contacts")
        .select("*, students(first_name, last_name)")
        .in("student_id", studentIds)
        .eq("can_pick_up", true)
        .eq("is_active", true);
      return { contacts: data ?? [] };
    },
  }),
  section({
    key: "financial-responsibility",
    label: "Financial Responsibility",
    group: "financial",
    sortOrder: 60,
    moduleKey: "finance",
    permissions: ["students.view", "finance.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const { getFamilyFinancialProfile } = await import("@/lib/finance/family-center");
      const profile = await getFamilyFinancialProfile(supabase, env.familyId);
      return {
        payers: profile?.payers ?? [],
        guardians: profile?.guardians ?? [],
        account: profile?.account ?? null,
      };
    },
  }),
  section({
    key: "tuition",
    label: "Tuition",
    group: "financial",
    sortOrder: 70,
    moduleKey: "finance",
    permissions: ["finance.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const { getFamilyFinancialProfile } = await import("@/lib/finance/family-center");
      return getFamilyFinancialProfile(supabase, env.familyId);
    },
  }),
  section({
    key: "scholarships",
    label: "Scholarships",
    group: "financial",
    sortOrder: 80,
    moduleKey: "scholarships",
    permissions: ["students.view", "scholarships.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const { getFamilyFinancialProfile } = await import("@/lib/finance/family-center");
      const profile = await getFamilyFinancialProfile(supabase, env.familyId);
      return {
        scholarships: profile?.scholarships ?? [],
        stateFunding: profile?.stateFunding ?? [],
        students: profile?.students ?? [],
      };
    },
  }),
  section({
    key: "communications",
    label: "Communications",
    group: "communication",
    sortOrder: 90,
    moduleKey: "platform",
    permissions: ["students.view", "portal.parent.access"],
    status: "partial",
    activityClassification: "communication",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      return getEntityActivity(supabase, "family", env.familyId, {
        classification: "communication",
      });
    },
  }),
  section({
    key: "documents",
    label: "Documents",
    group: "operations",
    sortOrder: 100,
    moduleKey: "ssis",
    permissions: ["students.view", "portal.parent.access"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const studentIds = await loadFamilyStudentIds(supabase, env.familyId);
      if (!studentIds.length) return { documents: [] };
      const { data } = await supabase
        .from("student_documents")
        .select("*, students(first_name, last_name)")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(50);
      return { documents: data ?? [] };
    },
  }),
  section({
    key: "forms",
    label: "Forms",
    group: "operations",
    sortOrder: 110,
    moduleKey: "ssis",
    permissions: ["students.view", "portal.parent.access"],
    status: "placeholder",
    loadData: async () => ({
      forms: [],
      message: "Family form submissions will appear here.",
    }),
  }),
  section({
    key: "calendar",
    label: "Calendar",
    group: "operations",
    sortOrder: 120,
    moduleKey: "scheduling",
    permissions: ["students.view", "portal.parent.access"],
    status: "placeholder",
    loadData: async () => ({
      events: [],
      message: "Family calendar integration ships in a future release.",
    }),
  }),
  section({
    key: "transportation",
    label: "Transportation",
    group: "student_life",
    sortOrder: 130,
    moduleKey: "ssis",
    permissions: ["students.view", "portal.parent.access"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const studentIds = await loadFamilyStudentIds(supabase, env.familyId);
      if (!studentIds.length) return { routes: [] };
      const { data } = await supabase
        .from("platform_relationships")
        .select("*")
        .eq("from_entity_type", "student")
        .in("from_entity_id", studentIds)
        .eq("relationship_type", "student.transportation_route")
        .eq("status", "active");
      return { routes: data ?? [] };
    },
  }),
  section({
    key: "medical",
    label: "Medical",
    group: "support",
    sortOrder: 140,
    moduleKey: "ssis",
    permissions: ["students.view", "ferpa.view_medical", "portal.parent.access"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      const studentIds = await loadFamilyStudentIds(supabase, env.familyId);
      if (!studentIds.length) return { profiles: [] };
      const { getStudentMedicalProfile } = await import("@/lib/sis/queries");
      const profiles = await Promise.all(studentIds.map((id) => getStudentMedicalProfile(id)));
      return { profiles: profiles.filter(Boolean) };
    },
  }),
  section({
    key: "notes",
    label: "Notes",
    group: "communication",
    sortOrder: 150,
    moduleKey: "platform",
    permissions: ["students.view", "students.edit"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      return getEntityNotes(supabase, "family", env.familyId, { pinnedFirst: true });
    },
  }),
  section({
    key: "activity",
    label: "Activity",
    group: "communication",
    sortOrder: 160,
    moduleKey: "platform",
    permissions: ["students.view", "portal.parent.access"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      return getEntityActivity(supabase, "family", env.familyId);
    },
  }),
  section({
    key: "ai-insights",
    label: "AI Insights",
    group: "intelligence",
    sortOrder: 170,
    moduleKey: "decision_intelligence",
    permissions: ["students.view", "ai.view"],
    status: "placeholder",
    loadData: async () => ({
      insights: [],
      message: "Family intelligence recommendations will appear here.",
    }),
  }),
  section({
    key: "audit",
    label: "Audit",
    group: "system",
    sortOrder: 180,
    moduleKey: "platform",
    permissions: ["students.view", "audit.view_all"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = familyEnvelope(envelope);
      if (!env) return null;
      return getAuditActivity(supabase, {
        entityType: "family",
        entityId: env.familyId,
      });
    },
  }),
];

export const FAMILY_PROFILE_SECTION_COUNT = FAMILY_PROFILE_SECTIONS.length;
