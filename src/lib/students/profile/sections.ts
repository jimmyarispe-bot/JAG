import { getStudentActivityFeed, getAuditActivity } from "@/lib/platform/activity";
import type { ProfileEnvelopeBase, ProfileSectionDefinition } from "@/lib/platform/profile/types";
import { studentFromContext, summaryFromContext } from "@/lib/students/profile/section-context";
import type { StudentProfileEnvelope } from "@/lib/students/profile/types";
import { isStudentProfileEnvelope } from "@/lib/students/profile/types";

function studentEnvelope(envelope: ProfileEnvelopeBase): StudentProfileEnvelope | null {
  return isStudentProfileEnvelope(envelope) ? envelope : null;
}

function section(partial: ProfileSectionDefinition): ProfileSectionDefinition {
  return partial;
}

/** Student profile section definitions (loaders + metadata). Components registered via register-modules. */
export const STUDENT_PROFILE_SECTIONS: ProfileSectionDefinition[] = [
  section({
    key: "overview",
    label: "Overview",
    group: null,
    pinned: true,
    sortOrder: 0,
    moduleKey: "platform",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope, ctx) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentById, getEnrollmentsByStudent } = await import("@/lib/students/queries");
      const { getStudentExecutiveSummary } = await import("@/lib/ssis/queries");
      const { getStudentConversion } = await import("@/lib/sis/queries");
      const student =
        studentFromContext(ctx) ?? (await getStudentById(env.studentId));
      if (!student) return null;
      const summary =
        summaryFromContext(ctx) ??
        (await getStudentExecutiveSummary(env.studentId));
      const [enrollments, conversion] = await Promise.all([
        getEnrollmentsByStudent(env.studentId),
        getStudentConversion(env.studentId),
      ]);
      return { student, summary, enrollments, conversion };
    },
  }),
  section({
    key: "identity",
    label: "Identity",
    group: "core",
    sortOrder: 10,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentById } = await import("@/lib/students/queries");
      const { getEntityTags } = await import("@/lib/platform/tags");
      const student = await getStudentById(env.studentId);
      const tags = env.organizationId
        ? await getEntityTags(supabase, "student", env.studentId)
        : [];
      return { student, tags };
    },
  }),
  section({
    key: "admissions",
    label: "Admissions",
    group: "core",
    sortOrder: 20,
    moduleKey: "admissions",
    permissions: ["students.view", "admissions.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentConversion } = await import("@/lib/sis/queries");
      return getStudentConversion(env.studentId);
    },
  }),
  section({
    key: "enrollment",
    label: "Enrollment",
    group: "core",
    sortOrder: 30,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getEnrollmentsByStudent, getStudentById } = await import("@/lib/students/queries");
      const { getStudentLifecycleHistory } = await import("@/lib/ssis/transitions");
      const { getStudentConversion } = await import("@/lib/sis/queries");
      const [student, enrollments, conversion] = await Promise.all([
        getStudentById(env.studentId),
        getEnrollmentsByStudent(env.studentId),
        getStudentConversion(env.studentId),
      ]);
      const lifecycleHistory = await getStudentLifecycleHistory(supabase, env.studentId);
      return { student, enrollments, conversion, lifecycleHistory };
    },
  }),
  section({
    key: "academics",
    label: "Academics",
    group: "learning",
    sortOrder: 40,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentAcademicProfile, getStudentSpedPlans } = await import("@/lib/sis/queries");
      const [academic, spedPlans] = await Promise.all([
        getStudentAcademicProfile(env.studentId),
        getStudentSpedPlans(env.studentId),
      ]);
      return { academic, spedPlans };
    },
  }),
  section({
    key: "progress",
    label: "Progress Monitoring",
    group: "learning",
    sortOrder: 50,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentAcademicProfile } = await import("@/lib/sis/queries");
      const academic = await getStudentAcademicProfile(env.studentId);
      return {
        goals: academic.goals,
        interventions: academic.interventions,
        profile: academic.profile,
      };
    },
  }),
  section({
    key: "map-nwea",
    label: "MAP / NWEA",
    group: "learning",
    sortOrder: 60,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "placeholder",
    loadData: async () => ({ connectorKey: "nwea_map", results: [] }),
  }),
  section({
    key: "attendance",
    label: "Attendance",
    group: "student_life",
    sortOrder: 70,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope, ctx) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentAttendance } = await import("@/lib/sis/queries");
      const { getStudentExecutiveSummary } = await import("@/lib/ssis/queries");
      const { getStudentById } = await import("@/lib/students/queries");
      const student = studentFromContext(ctx) ?? (await getStudentById(env.studentId));
      const [records, summary] = await Promise.all([
        getStudentAttendance(env.studentId),
        summaryFromContext(ctx) ??
          (student
            ? getStudentExecutiveSummary(env.studentId)
            : Promise.resolve(null)),
      ]);
      return { records, summary };
    },
  }),
  section({
    key: "behavior",
    label: "Behavior",
    group: "student_life",
    sortOrder: 80,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope, ctx) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentBehavior } = await import("@/lib/sis/queries");
      const { getStudentExecutiveSummary } = await import("@/lib/ssis/queries");
      const { getStudentById } = await import("@/lib/students/queries");
      const student = studentFromContext(ctx) ?? (await getStudentById(env.studentId));
      const [events, summary] = await Promise.all([
        getStudentBehavior(env.studentId),
        summaryFromContext(ctx) ??
          (student
            ? getStudentExecutiveSummary(env.studentId)
            : Promise.resolve(null)),
      ]);
      return { events, summary };
    },
  }),
  section({
    key: "scheduling",
    label: "Scheduling",
    group: "student_life",
    sortOrder: 90,
    moduleKey: "scheduling",
    permissions: ["students.view"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentSchedule } = await import("@/lib/scheduling/queries");
      return getStudentSchedule(env.studentId);
    },
  }),
  section({
    key: "special-ed",
    label: "Special Education",
    group: "support",
    sortOrder: 100,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope, ctx) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentSpedPlans } = await import("@/lib/sis/queries");
      const { getStudentExecutiveSummary } = await import("@/lib/ssis/queries");
      const { getStudentById } = await import("@/lib/students/queries");
      const student = studentFromContext(ctx) ?? (await getStudentById(env.studentId));
      const [plans, summary] = await Promise.all([
        getStudentSpedPlans(env.studentId),
        summaryFromContext(ctx) ??
          (student
            ? getStudentExecutiveSummary(env.studentId)
            : Promise.resolve(null)),
      ]);
      return { plans, reviewDue: summary?.spedReviewDue ?? false };
    },
  }),
  section({
    key: "therapy",
    label: "Therapy Services",
    group: "support",
    sortOrder: 110,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentServices } = await import("@/lib/sis/queries");
      return getStudentServices(env.studentId);
    },
  }),
  section({
    key: "medical",
    label: "Medical",
    group: "support",
    sortOrder: 120,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope, ctx) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentMedicalProfile } = await import("@/lib/sis/queries");
      const { getStudentExecutiveSummary } = await import("@/lib/ssis/queries");
      const { getStudentById } = await import("@/lib/students/queries");
      const student = studentFromContext(ctx) ?? (await getStudentById(env.studentId));
      const [medical, summary] = await Promise.all([
        getStudentMedicalProfile(env.studentId),
        summaryFromContext(ctx) ??
          (student
            ? getStudentExecutiveSummary(env.studentId)
            : Promise.resolve(null)),
      ]);
      return { medical, alertCount: summary?.medicalAlertCount ?? 0 };
    },
  }),
  section({
    key: "family",
    label: "Family & Guardians",
    group: "support",
    sortOrder: 130,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getGuardiansByFamily, getStudentById } = await import("@/lib/students/queries");
      const {
        getStudentAuthorizedContacts,
      } = await import("@/lib/sis/queries");
      const { getFamilyHouseholds, getStudentSiblings } = await import("@/lib/ssis/family");
      const { getStudentRelationships } = await import("@/lib/platform/relationships");
      const familyId = env.familyId;
      const [student, guardians, authorizedContacts, siblings, households, relationships] =
        await Promise.all([
          getStudentById(env.studentId),
          familyId ? getGuardiansByFamily(familyId) : Promise.resolve([]),
          getStudentAuthorizedContacts(env.studentId),
          getStudentSiblings(env.studentId),
          familyId ? getFamilyHouseholds(familyId) : Promise.resolve([]),
          getStudentRelationships(supabase, env.studentId),
        ]);
      return { student, guardians, authorizedContacts, siblings, households, relationships };
    },
  }),
  section({
    key: "billing",
    label: "Tuition & Billing",
    group: "financial",
    sortOrder: 140,
    moduleKey: "finance",
    permissions: ["students.view", "finance.view"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env?.familyId) return { account: null, message: "No family billing account linked" };
      const { getFamilyFinancialProfile } = await import("@/lib/finance/family-center");
      return getFamilyFinancialProfile(supabase, env.familyId);
    },
  }),
  section({
    key: "scholarships",
    label: "Scholarships",
    group: "financial",
    sortOrder: 150,
    moduleKey: "scholarships",
    permissions: ["students.view", "scholarships.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentFundingCenter } = await import("@/lib/ssis/queries");
      const funding = await getStudentFundingCenter(supabase, env.studentId);
      const scholarships = (funding ?? []).filter(
        (r: Record<string, unknown>) =>
          String(r.funding_category ?? "").includes("scholarship")
      );
      return { funding, scholarships };
    },
  }),
  section({
    key: "transportation",
    label: "Transportation",
    group: "operations",
    sortOrder: 160,
    moduleKey: "transportation",
    permissions: ["students.view"],
    status: "placeholder",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentRelationships } = await import("@/lib/platform/relationships");
      const routes = await getStudentRelationships(supabase, env.studentId, {
        relationshipType: "student.transportation_route",
      });
      return { routes, message: "Enable Transportation in Configuration Studio for full route management" };
    },
  }),
  section({
    key: "documents",
    label: "Documents",
    group: "operations",
    sortOrder: 170,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getStudentDocuments, getStudentConversion } = await import("@/lib/sis/queries");
      const [documents, conversion] = await Promise.all([
        getStudentDocuments(env.studentId),
        getStudentConversion(env.studentId),
      ]);
      return { documents, conversion };
    },
  }),
  section({
    key: "compliance",
    label: "Compliance",
    group: "operations",
    sortOrder: 180,
    moduleKey: "compliance",
    permissions: ["students.view", "compliance.view"],
    status: "partial",
    loadData: async () => ({
      obligations: [],
      message: "Student-scoped compliance obligations — full integration in Phase 2B",
    }),
  }),
  section({
    key: "communications",
    label: "Communications",
    group: "intelligence",
    sortOrder: 190,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    activityClassification: "communication",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      return getStudentActivityFeed(supabase, env.studentId, {
        classification: "communication",
      });
    },
  }),
  section({
    key: "parent-engagement",
    label: "Parent Engagement",
    group: "intelligence",
    sortOrder: 195,
    moduleKey: "ssis",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      const { getParentEngagementSummary } = await import("@/lib/ssis/engagement");
      return getParentEngagementSummary(supabase, env.studentId);
    },
  }),
  section({
    key: "ai-insights",
    label: "AI Insights",
    group: "intelligence",
    sortOrder: 200,
    moduleKey: "decision_intelligence",
    permissions: ["students.view"],
    status: "placeholder",
    loadData: async () => ({
      insights: [],
      message: "Intelligence Network recommendations will appear here",
    }),
  }),
  section({
    key: "timeline",
    label: "Timeline",
    group: "system",
    sortOrder: 210,
    moduleKey: "platform",
    permissions: ["students.view"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      return getStudentActivityFeed(supabase, env.studentId);
    },
  }),
  section({
    key: "audit",
    label: "Audit History",
    group: "system",
    sortOrder: 220,
    moduleKey: "platform",
    permissions: ["students.view", "audit.view_all"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = studentEnvelope(envelope);
      if (!env) return null;
      return getAuditActivity(supabase, { studentId: env.studentId });
    },
  }),
];
