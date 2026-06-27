import {
  getAuditActivity,
  getEmployeeActivityFeed,
} from "@/lib/platform/activity";
import { getEntityNotes } from "@/lib/platform/notes";
import {
  getEmployeeAssignedStudents,
  getEmployeeDirectReports,
  getEmployeeRelationships,
} from "@/lib/platform/relationships";
import { getEntityTags } from "@/lib/platform/tags";
import type { ProfileEnvelopeBase, ProfileSectionDefinition } from "@/lib/platform/profile/types";
import type { EmployeeProfileEnvelope } from "@/lib/employees/profile/types";
import { isEmployeeProfileEnvelope } from "@/lib/employees/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function employeeEnvelope(envelope: ProfileEnvelopeBase): EmployeeProfileEnvelope | null {
  return isEmployeeProfileEnvelope(envelope) ? envelope : null;
}

function section(partial: ProfileSectionDefinition): ProfileSectionDefinition {
  return partial;
}

async function loadEmployeeRecord(supabase: AuthClient, employeeId: string) {
  const { data } = await supabase
    .from("employees")
    .select("*, schools(name, organization_id), employee_profiles(*)")
    .eq("id", employeeId)
    .maybeSingle();
  return data;
}

/** Employee profile section definitions — registered via Platform Profile Registry. */
export const EMPLOYEE_PROFILE_SECTIONS: ProfileSectionDefinition[] = [
  section({
    key: "overview",
    label: "Overview",
    group: null,
    pinned: true,
    sortOrder: 0,
    moduleKey: "platform",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { getEmployeeProfile } = await import("@/lib/hr/employee-profile");
      const profile = await getEmployeeProfile(supabase, env.employeeId);
      const tags = env.organizationId
        ? await getEntityTags(supabase, "employee", env.employeeId)
        : [];
      return { profile, tags };
    },
  }),
  section({
    key: "employment-information",
    label: "Employment Information",
    group: "employment",
    sortOrder: 10,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const employee = await loadEmployeeRecord(supabase, env.employeeId);
      const { data: serviceHistory } = await supabase
        .from("employee_service_history")
        .select("*")
        .eq("employee_id", env.employeeId)
        .order("effective_date", { ascending: false });
      return { employee, serviceHistory: serviceHistory ?? [] };
    },
  }),
  section({
    key: "position",
    label: "Position",
    group: "employment",
    sortOrder: 20,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data: positions } = await supabase
        .from("employee_positions")
        .select("*, positions(title, department, employment_type)")
        .eq("employee_id", env.employeeId);
      const relationships = await getEmployeeRelationships(supabase, env.employeeId);
      return { positions: positions ?? [], relationships };
    },
  }),
  section({
    key: "department",
    label: "Department",
    group: "employment",
    sortOrder: 30,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const employee = await loadEmployeeRecord(supabase, env.employeeId);
      const relationships = await getEmployeeRelationships(supabase, env.employeeId, {
        relationshipType: "employee.department",
      });
      return { employee, relationships };
    },
  }),
  section({
    key: "supervisor",
    label: "Supervisor",
    group: "employment",
    sortOrder: 40,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const employee = await loadEmployeeRecord(supabase, env.employeeId);
      const relationships = await getEmployeeRelationships(supabase, env.employeeId, {
        relationshipType: "employee.supervisor",
      });
      return { employee, relationships };
    },
  }),
  section({
    key: "schools",
    label: "Schools",
    group: "employment",
    sortOrder: 50,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const employee = await loadEmployeeRecord(supabase, env.employeeId);
      const relationships = await getEmployeeRelationships(supabase, env.employeeId, {
        relationshipType: "employee.school",
      });
      return { employee, relationships };
    },
  }),
  section({
    key: "schedule",
    label: "Schedule",
    group: "employment",
    sortOrder: 60,
    moduleKey: "scheduling",
    permissions: ["hr.view", "employee.self_service"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data: sessions } = await supabase
        .from("instructional_sessions")
        .select("id, scheduled_start, scheduled_end, session_status, course_sections(section_code, courses(name))")
        .eq("instructor_employee_id", env.employeeId)
        .order("scheduled_start", { ascending: false })
        .limit(30);
      return { sessions: sessions ?? [] };
    },
  }),
  section({
    key: "work-assignments",
    label: "Work Assignments",
    group: "employment",
    sortOrder: 70,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const [{ data: positions }, { data: sections }] = await Promise.all([
        supabase
          .from("employee_positions")
          .select("*, positions(title, department)")
          .eq("employee_id", env.employeeId),
        supabase
          .from("course_sections")
          .select("id, section_code, courses(name)")
          .eq("instructor_employee_id", env.employeeId),
      ]);
      return { positions: positions ?? [], courseSections: sections ?? [] };
    },
  }),
  section({
    key: "compensation",
    label: "Compensation",
    group: "hr",
    sortOrder: 100,
    moduleKey: "hr",
    permissions: ["hr.view", "hr.manage"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const employee = await loadEmployeeRecord(supabase, env.employeeId);
      return {
        employee,
        message: "Compensation details available to HR managers.",
      };
    },
  }),
  section({
    key: "payroll",
    label: "Payroll",
    group: "hr",
    sortOrder: 110,
    moduleKey: "hr",
    permissions: ["hr.view", "payroll.run", "finance.payroll"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data } = await supabase
        .from("payroll_records")
        .select("*")
        .eq("employee_id", env.employeeId)
        .order("pay_period_end", { ascending: false })
        .limit(24);
      return { records: data ?? [] };
    },
  }),
  section({
    key: "pto",
    label: "PTO",
    group: "hr",
    sortOrder: 120,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("employee_id", env.employeeId)
        .order("created_at", { ascending: false })
        .limit(20);
      return { requests: data ?? [] };
    },
  }),
  section({
    key: "benefits",
    label: "Benefits",
    group: "hr",
    sortOrder: 130,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "placeholder",
    loadData: async () => ({
      enrollments: [],
      message: "Benefits enrollment integration ships in a future HR release.",
    }),
  }),
  section({
    key: "performance-reviews",
    label: "Performance Reviews",
    group: "hr",
    sortOrder: 140,
    moduleKey: "hr",
    permissions: ["hr.view", "hr.manage"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data } = await supabase
        .from("performance_evaluations")
        .select("*")
        .eq("employee_id", env.employeeId)
        .order("created_at", { ascending: false });
      return { evaluations: data ?? [] };
    },
  }),
  section({
    key: "certifications",
    label: "Certifications",
    group: "hr",
    sortOrder: 150,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data } = await supabase
        .from("employee_certifications")
        .select("*")
        .eq("employee_id", env.employeeId)
        .order("expiration_date");
      return { certifications: data ?? [] };
    },
  }),
  section({
    key: "licenses",
    label: "Licenses",
    group: "hr",
    sortOrder: 160,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data } = await supabase
        .from("employee_certifications")
        .select("*")
        .eq("employee_id", env.employeeId)
        .order("expiration_date");
      const licenses = (data ?? []).filter((row) =>
        String(row.certification_type ?? "")
          .toLowerCase()
          .includes("license")
      );
      return { licenses, allCertifications: data ?? [] };
    },
  }),
  section({
    key: "professional-development",
    label: "Professional Development",
    group: "hr",
    sortOrder: 170,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data } = await supabase
        .from("employee_training_records")
        .select("*")
        .eq("employee_id", env.employeeId)
        .order("completed_at", { ascending: false });
      return { training: data ?? [] };
    },
  }),
  section({
    key: "timesheets",
    label: "Timesheets",
    group: "operations",
    sortOrder: 180,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data } = await supabase
        .from("employee_time_entries")
        .select("*")
        .eq("employee_id", env.employeeId)
        .order("entry_date", { ascending: false })
        .limit(30);
      return { entries: data ?? [] };
    },
  }),
  section({
    key: "documents",
    label: "Documents",
    group: "operations",
    sortOrder: 190,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data } = await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", env.employeeId)
        .order("created_at", { ascending: false });
      const relationships = await getEmployeeRelationships(supabase, env.employeeId);
      return { documents: data ?? [], relationships };
    },
  }),
  section({
    key: "compliance",
    label: "Compliance",
    group: "operations",
    sortOrder: 200,
    moduleKey: "compliance",
    permissions: ["hr.view", "compliance.view"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { getComplianceCenter } = await import("@/lib/hr/employee-profile");
      const center = await getComplianceCenter(supabase, env.schoolId ?? undefined);
      return center;
    },
  }),
  section({
    key: "notes",
    label: "Notes",
    group: "communication",
    sortOrder: 210,
    moduleKey: "platform",
    permissions: ["hr.view", "hr.manage"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      return getEntityNotes(supabase, "employee", env.employeeId, { pinnedFirst: true });
    },
  }),
  section({
    key: "activity",
    label: "Activity",
    group: "communication",
    sortOrder: 220,
    moduleKey: "platform",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      return getEmployeeActivityFeed(supabase, env.employeeId);
    },
  }),
  section({
    key: "communications",
    label: "Communications",
    group: "communication",
    sortOrder: 230,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    activityClassification: "communication",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      return getEmployeeActivityFeed(supabase, env.employeeId, {
        classification: "communication",
      });
    },
  }),
  section({
    key: "direct-reports",
    label: "Direct Reports",
    group: "relationships",
    sortOrder: 240,
    moduleKey: "hr",
    permissions: ["hr.view", "hr.manage"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      return getEmployeeDirectReports(supabase, env.employeeId);
    },
  }),
  section({
    key: "teams",
    label: "Teams",
    group: "relationships",
    sortOrder: 250,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const relationships = await getEmployeeRelationships(supabase, env.employeeId);
      return {
        relationships,
        message: "Instructional team memberships appear when assigned as a team member.",
      };
    },
  }),
  section({
    key: "classes",
    label: "Classes",
    group: "relationships",
    sortOrder: 260,
    moduleKey: "scheduling",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      const { data: sections } = await supabase
        .from("course_sections")
        .select("id, section_code, courses(name, program)")
        .eq("instructor_employee_id", env.employeeId);
      const relationships = await getEmployeeRelationships(supabase, env.employeeId, {
        relationshipType: "student.class",
      });
      return { courseSections: sections ?? [], relationships };
    },
  }),
  section({
    key: "students",
    label: "Students",
    group: "relationships",
    sortOrder: 270,
    moduleKey: "hr",
    permissions: ["hr.view", "employee.self_service"],
    status: "live",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      return getEmployeeAssignedStudents(supabase, env.employeeId);
    },
  }),
  section({
    key: "ai-insights",
    label: "AI Insights",
    group: "intelligence",
    sortOrder: 280,
    moduleKey: "decision_intelligence",
    permissions: ["hr.view"],
    status: "placeholder",
    loadData: async () => ({
      insights: [],
      message: "Workforce intelligence recommendations will appear here.",
    }),
  }),
  section({
    key: "audit",
    label: "Audit History",
    group: "intelligence",
    sortOrder: 290,
    moduleKey: "platform",
    permissions: ["hr.view", "audit.view_all"],
    status: "partial",
    loadData: async (supabase, envelope) => {
      const env = employeeEnvelope(envelope);
      if (!env) return null;
      return getAuditActivity(supabase, {
        entityType: "employee",
        entityId: env.employeeId,
      });
    },
  }),
];

export const EMPLOYEE_PROFILE_SECTION_COUNT = EMPLOYEE_PROFILE_SECTIONS.length;
