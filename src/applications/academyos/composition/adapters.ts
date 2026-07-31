import type {
  AcademyCompositionOverrides,
  AcademyPlatformAdapters,
  AcademyWorkflowAdapters,
} from "@/applications/academyos/composition/types";
import {
  ApiPlatformAdapter,
  EntityPlatformAdapter,
  ForecastingPlatformAdapter,
  FormsPlatformAdapter,
  IntelligencePlatformAdapter,
} from "@/applications/academyos/platform-adapters";
import {
  AdmissionsWorkflowAdapter,
  FinanceWorkflowAdapter,
  HRWorkflowAdapter,
  StudentWorkflowAdapter,
} from "@/applications/academyos/workflow-adapters";

/** Register workflow adapters — only composition may bind these. */
export function bindAcademyWorkflowAdapters(
  overrides?: AcademyCompositionOverrides["workflowAdapters"]
): AcademyWorkflowAdapters {
  return {
    admissions: overrides?.admissions ?? AdmissionsWorkflowAdapter,
    students: overrides?.students ?? StudentWorkflowAdapter,
    finance: overrides?.finance ?? FinanceWorkflowAdapter,
    hr: overrides?.hr ?? HRWorkflowAdapter,
  };
}

/** Register platform adapters — only composition may bind these. */
export function bindAcademyPlatformAdapters(
  overrides?: AcademyCompositionOverrides["platformAdapters"]
): AcademyPlatformAdapters {
  return {
    entity: overrides?.entity ?? EntityPlatformAdapter,
    forms: overrides?.forms ?? FormsPlatformAdapter,
    api: overrides?.api ?? ApiPlatformAdapter,
    intelligence: overrides?.intelligence ?? IntelligencePlatformAdapter,
    forecasting: overrides?.forecasting ?? ForecastingPlatformAdapter,
  };
}
