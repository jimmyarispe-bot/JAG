/**
 * JAG Organization Studio — public API.
 * Answers in → Organization Blueprint out. Not a UI.
 */

export type {
  OrganizationStudioAnswers,
  ProduceOrganizationBlueprintInput,
  ProduceOrganizationBlueprintResult,
  StudioAiAnswers,
  StudioCalendarAnswer,
  StudioIdentityAnswers,
  StudioIntegrationAnswer,
  StudioLocationAnswer,
  StudioPolicyAnswer,
  StudioProgramAnswer,
  StudioQuestion,
  StudioQuestionType,
  StudioRoleAnswer,
  StudioSectionId,
} from "@/jag/studio/contracts";

export { produceOrganizationBlueprint } from "@/jag/studio/produce";
export { listStudioQuestions } from "@/jag/studio/questions";
export {
  validateOrganizationStudioAnswers,
  type StudioValidationIssue,
  type StudioValidationResult,
} from "@/jag/studio/validation";
export {
  organizationBlueprintKnowledgeKeys,
  studioAnswersSummary,
} from "@/jag/studio/testing";
