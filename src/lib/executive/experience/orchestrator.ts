import { updatePortalPreferencesAction } from "@/lib/portal/actions";
import {
  EXECUTIVE_EXPERIENCE_ENGINES,
  EXECUTIVE_EXPERIENCE_GUARDS,
  EXECUTIVE_EXPERIENCE_NAV,
  EXECUTIVE_QUICK_ACTIONS,
} from "./constants";
import { publishExecutiveExperienceEvent } from "./events";
import { getExecutiveExperienceHome } from "./home";
import {
  getExecutiveAcademicsSummary,
  getExecutiveCommunicationsSummary,
  getExecutiveFinanceSummary,
  getExecutiveInnovationSummary,
  getExecutiveIntelligenceSummary,
  getExecutiveMultiSchoolSummary,
  getExecutiveOperationsSummary,
  getExecutivePeopleSummary,
  getExecutiveReportsCatalog,
  getExecutiveStrategySummary,
} from "./summaries";

export function createExecutiveExperienceOrchestrator() {
  return {
    guards: EXECUTIVE_EXPERIENCE_GUARDS,
    engines: EXECUTIVE_EXPERIENCE_ENGINES,
    nav: EXECUTIVE_EXPERIENCE_NAV,
    quickActions: EXECUTIVE_QUICK_ACTIONS,

    publishDashboardViewed(input: {
      organizationId: string;
      actorUserId: string;
      schoolId?: string | null;
    }) {
      return publishExecutiveExperienceEvent({
        type: "executive.dashboard_viewed",
        organizationId: input.organizationId,
        recordType: "organization",
        recordId: input.schoolId ?? input.organizationId,
        actorUserId: input.actorUserId,
      });
    },

    getHome: getExecutiveExperienceHome,
    getMultiSchool: getExecutiveMultiSchoolSummary,
    getAcademics: getExecutiveAcademicsSummary,
    getOperations: getExecutiveOperationsSummary,
    getFinance: getExecutiveFinanceSummary,
    getPeople: getExecutivePeopleSummary,
    getStrategy: getExecutiveStrategySummary,
    getInnovation: getExecutiveInnovationSummary,
    getIntelligence: getExecutiveIntelligenceSummary,
    getCommunications: getExecutiveCommunicationsSummary,
    getReportsCatalog: getExecutiveReportsCatalog,

    async updateProfile(formData: FormData, organizationId?: string | null) {
      const result = await updatePortalPreferencesAction(formData);
      if (!("error" in result && result.error) && organizationId) {
        publishExecutiveExperienceEvent({
          type: "executive.profile_updated",
          organizationId,
          recordType: "executive_preferences",
          recordId: String(formData.get("user_id") ?? "executive"),
        });
      }
      return result;
    },
  };
}

export type ExecutiveExperienceOrchestrator = ReturnType<
  typeof createExecutiveExperienceOrchestrator
>;

let singleton: ExecutiveExperienceOrchestrator | null = null;

export function getExecutiveExperience(): ExecutiveExperienceOrchestrator {
  if (!singleton) singleton = createExecutiveExperienceOrchestrator();
  return singleton;
}
