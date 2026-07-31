/**
 * JAG Universal Application Modeling Engine — public API.
 */

export type {
  ApplicationModel,
  ApplicationModelMetadata,
  ConfigurationModel,
  IntegrationModel,
  LocalizationModel,
  TerminologyModel,
  WorkflowModel,
} from "@/jag/modeling/application-model";


export type { EntityModel } from "@/jag/modeling/entity-model";
export type { ProcessModel } from "@/jag/modeling/process-model";
export type { DecisionModel } from "@/jag/modeling/decision-model";
export type { FormModel } from "@/jag/modeling/form-model";
export type {
  DocumentModelBundle,
  DocumentDefinitionModel,
  DocumentCategoryModel,
} from "@/jag/modeling/document-model";
export type { CommunicationModelBundle } from "@/jag/modeling/communication-model";
export type { PermissionModel } from "@/jag/modeling/permission-model";
export type { ReportModel } from "@/jag/modeling/report-model";
export type { NavigationModel } from "@/jag/modeling/navigation-model";

export {
  compileApplicationModel,
  type CompileApplicationModelOptions,
} from "@/jag/modeling/compiler";

export {
  validateApplicationModel,
  type ModelValidationIssue,
  type ModelValidationResult,
} from "@/jag/modeling/validation";

export type {
  ApplicationModelCompilerPorts,
  ApplicationModelCompileResult,
  CompiledContributionSnapshot,
} from "@/jag/modeling/runtime";

export {
  contributionIdsByKind,
  sortedIds,
} from "@/jag/modeling/testing";
