/**
 * JAG Listening Intelligence — Slice 1 domain types.
 * Durable Postgres-backed listening data plane (no UI / AI in this slice).
 */

export const LISTENING_PRIVACY_MODES = [
  "anonymous",
  "confidential",
  "identified",
] as const;
export type ListeningPrivacyMode = (typeof LISTENING_PRIVACY_MODES)[number];

export const LISTENING_INITIATIVE_STATUSES = [
  "draft",
  "active",
  "closed",
  "archived",
] as const;
export type ListeningInitiativeStatus =
  (typeof LISTENING_INITIATIVE_STATUSES)[number];

export const LISTENING_VERSION_STATUSES = [
  "draft",
  "published",
  "retired",
] as const;
export type ListeningVersionStatus =
  (typeof LISTENING_VERSION_STATUSES)[number];

export const LISTENING_CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "open",
  "closed",
  "archived",
] as const;
export type ListeningCampaignStatus =
  (typeof LISTENING_CAMPAIGN_STATUSES)[number];

export const LISTENING_QUESTION_TYPES = [
  "single_choice",
  "multi_choice",
  "likert",
  "numeric",
  "nps",
  "ranking",
  "short_text",
  "long_text",
  "yes_no",
  "matrix",
] as const;
export type ListeningQuestionType = (typeof LISTENING_QUESTION_TYPES)[number];

/** V1 authoring / collection question types. */
export const LISTENING_V1_QUESTION_TYPES = [
  "single_choice",
  "likert",
  "long_text",
  "yes_no",
] as const satisfies readonly ListeningQuestionType[];

export type ListeningInitiative = {
  id: string;
  organizationId: string;
  title: string;
  purpose: string;
  status: ListeningInitiativeStatus;
  createdBy: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type ListeningInstrument = {
  id: string;
  organizationId: string;
  initiativeId: string | null;
  title: string;
  description: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListeningInstrumentVersion = {
  id: string;
  organizationId: string;
  instrumentId: string;
  versionNo: number;
  status: ListeningVersionStatus;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type ListeningQuestionOption = {
  id: string;
  organizationId: string;
  questionId: string;
  optionKey: string;
  label: string;
  displayOrder: number;
  valueNumeric: number | null;
};

export type ListeningQuestion = {
  id: string;
  organizationId: string;
  instrumentVersionId: string;
  questionKey: string;
  questionType: ListeningQuestionType;
  prompt: string;
  helpText: string;
  required: boolean;
  displayOrder: number;
  config: Record<string, unknown>;
  analysisHints: Record<string, unknown>;
  options?: readonly ListeningQuestionOption[];
};

export type ListeningSegment = {
  id: string;
  organizationId: string;
  segmentKey: string;
  label: string;
  description: string;
};

export type ListeningCampaign = {
  id: string;
  organizationId: string;
  initiativeId: string;
  instrumentVersionId: string;
  title: string;
  introduction: string;
  privacyStatement: string;
  status: ListeningCampaignStatus;
  privacyMode: ListeningPrivacyMode;
  opensAt: string | null;
  closesAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  minCohortSize: number;
};

export type ListeningAnswerValue =
  | { option_key: string }
  | { option_keys: string[] }
  | { number: number }
  | { text: string }
  | { boolean: boolean }
  | { rank_order: string[] };

export type ListeningPublicQuestion = {
  id: string;
  question_key: string;
  question_type: ListeningQuestionType;
  prompt: string;
  help_text: string;
  required: boolean;
  display_order: number;
  config: Record<string, unknown>;
  options: ReadonlyArray<{
    id: string;
    option_key: string;
    label: string;
    display_order: number;
    value_numeric: number | null;
  }>;
};

/** Safe public collection contract (no org secrets, no token hash, no results). */
export type ListeningPublicCampaignContract = {
  campaign_id: string;
  title: string;
  introduction: string;
  privacy_statement: string;
  privacy_mode: ListeningPrivacyMode;
  instrument_version_id: string;
  questions: readonly ListeningPublicQuestion[];
};

export type ListeningSubmitAnswerInput = {
  question_id: string;
  value: ListeningAnswerValue;
};

export type ListeningSubmitResult = {
  ok: true;
  response_id: string;
  submitted_at: string;
};

/** Future analytics guardrail (Slice 1 schema default). */
export const LISTENING_DEFAULT_MIN_COHORT = 5;
