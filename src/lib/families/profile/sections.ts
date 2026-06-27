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
      const [family, students, studentRelationships, guardianRelationships, tags] = await Promise.all([
        loadFamilyRecord(supabase, env.familyId),
        loadFamilyStudents(supabase, env.familyId),
        getFamilyStudentRelationships(supabase, env.familyId),
        getFamilyGuardianRelationships(supabase, env.familyId),
        env.organizationId
          ? getEntityTags(supabase, "family", env.familyId)
          : Promise.resolve([]),
      ]);
      return { family, students, studentRelationships, guardianRelationships, tags };
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
