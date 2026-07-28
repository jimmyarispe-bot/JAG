import type { ScenarioDefinition } from "../harness";
import { crossDomainScenario } from "./cross-domain";
import { employeeLifecycleScenario } from "./employee-lifecycle";
import { executiveWorkflowScenario } from "./executive-workflow";
import { familyFinancialScenario } from "./family-financial";
import { organizationIsolationScenario } from "./organization-isolation";
import { parentExperienceScenario } from "./parent-experience";
import { studentJourneyScenario } from "./student-journey";
import { teacherDailyScenario } from "./teacher-daily";

export const ALL_VALIDATION_SCENARIOS: readonly ScenarioDefinition[] =
  Object.freeze([
    studentJourneyScenario,
    familyFinancialScenario,
    employeeLifecycleScenario,
    teacherDailyScenario,
    parentExperienceScenario,
    executiveWorkflowScenario,
    crossDomainScenario,
    organizationIsolationScenario,
  ]);

export {
  studentJourneyScenario,
  familyFinancialScenario,
  employeeLifecycleScenario,
  teacherDailyScenario,
  parentExperienceScenario,
  executiveWorkflowScenario,
  crossDomainScenario,
  organizationIsolationScenario,
};
