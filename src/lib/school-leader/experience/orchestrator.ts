import { updatePortalPreferencesAction } from "@/lib/portal/actions";
import {
  SCHOOL_LEADER_EXPERIENCE_ENGINES,
  SCHOOL_LEADER_EXPERIENCE_GUARDS,
  SCHOOL_LEADER_EXPERIENCE_NAV,
  SCHOOL_LEADER_QUICK_ACTIONS,
} from "./constants";
import { publishSchoolLeaderExperienceEvent } from "./events";
import {
  getSchoolLeaderAcademicsSummary,
  getSchoolLeaderComplianceSummary,
  getSchoolLeaderCommunicationsSummary,
  getSchoolLeaderEnrollmentSummary,
  getSchoolLeaderFinanceSummary,
  getSchoolLeaderHrSummary,
  getSchoolLeaderReportsCatalog,
  getSchoolLeaderSchedulingSummary,
  getSchoolLeaderStudentsSummary,
  getSchoolLeaderTeachersSummary,
} from "./summaries";
import { getSchoolLeaderExperienceHome } from "./home";

export function createSchoolLeaderExperienceOrchestrator() {
  return {
    guards: SCHOOL_LEADER_EXPERIENCE_GUARDS,
    engines: SCHOOL_LEADER_EXPERIENCE_ENGINES,
    nav: SCHOOL_LEADER_EXPERIENCE_NAV,
    quickActions: SCHOOL_LEADER_QUICK_ACTIONS,

    publishDashboardViewed(input: {
      organizationId: string;
      actorUserId: string;
      schoolId?: string | null;
    }) {
      return publishSchoolLeaderExperienceEvent({
        type: "school_leader.dashboard_viewed",
        organizationId: input.organizationId,
        recordType: "campus",
        recordId: input.schoolId ?? input.organizationId,
        actorUserId: input.actorUserId,
      });
    },

    getHome: getSchoolLeaderExperienceHome,
    getEnrollment: getSchoolLeaderEnrollmentSummary,
    getStudents: getSchoolLeaderStudentsSummary,
    getTeachers: getSchoolLeaderTeachersSummary,
    getAcademics: getSchoolLeaderAcademicsSummary,
    getScheduling: getSchoolLeaderSchedulingSummary,
    getCompliance: getSchoolLeaderComplianceSummary,
    getFinance: getSchoolLeaderFinanceSummary,
    getHr: getSchoolLeaderHrSummary,
    getCommunications: getSchoolLeaderCommunicationsSummary,
    getReportsCatalog: getSchoolLeaderReportsCatalog,

    async updateProfile(formData: FormData, organizationId?: string | null) {
      const result = await updatePortalPreferencesAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishSchoolLeaderExperienceEvent({
          type: "school_leader.profile_updated",
          organizationId,
          recordType: "school_leader_preferences",
          recordId: String(formData.get("user_id") ?? "school-leader"),
        });
      }
      return result;
    },
  };
}

export type SchoolLeaderExperienceOrchestrator = ReturnType<
  typeof createSchoolLeaderExperienceOrchestrator
>;

let singleton: SchoolLeaderExperienceOrchestrator | null = null;

export function getSchoolLeaderExperience(): SchoolLeaderExperienceOrchestrator {
  if (!singleton) singleton = createSchoolLeaderExperienceOrchestrator();
  return singleton;
}
