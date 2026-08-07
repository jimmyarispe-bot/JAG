/**
 * Slice 3 — public respondent helpers (pure + view mapping).
 * Uses resolve_public_listening_campaign / submit_listening_response contracts.
 */

import { estimateCompletionMinutes, parseQuestionConfig } from "./authoring";
import type {
  ListeningAnswerValue,
  ListeningPrivacyMode,
  ListeningPublicCampaignContract,
  ListeningPublicQuestion,
  ListeningSubmitAnswerInput,
} from "./types";

export type ListeningPublicErrorKind =
  | "invalid_token"
  | "closed"
  | "expired"
  | "unavailable"
  | "network"
  | "validation"
  | "unexpected";

export type ListeningPublicErrorView = {
  readonly kind: ListeningPublicErrorKind;
  readonly title: string;
  readonly description: string;
};

export type ListeningRespondentSection = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
};

export type ListeningRespondentQuestion = {
  readonly id: string;
  readonly number: number;
  readonly prompt: string;
  readonly helpText: string;
  readonly required: boolean;
  readonly questionType: string;
  readonly sectionId: string | null;
  readonly placeholder?: string;
  readonly defaultValue?: string | number | null;
  readonly min?: number | null;
  readonly max?: number | null;
  readonly step?: number | null;
  readonly likertLowLabel?: string;
  readonly likertHighLabel?: string;
  readonly options: readonly {
    readonly id: string;
    readonly optionKey: string;
    readonly label: string;
    readonly valueNumeric: number | null;
  }[];
};

/** Safe client contract — no campaign_id / instrument_version_id. */
export type ListeningRespondentView = {
  readonly title: string;
  readonly introduction: string;
  readonly privacyStatement: string;
  readonly privacyMode: ListeningPrivacyMode;
  readonly estimatedMinutes: number;
  readonly questionCount: number;
  readonly sections: readonly ListeningRespondentSection[];
  readonly questions: readonly ListeningRespondentQuestion[];
};

export type ListeningDraftAnswers = Record<string, unknown>;

export function draftStorageKey(token: string): string {
  return `listening.respondent.draft.v1.${token.trim()}`;
}

export function submittedStorageKey(token: string): string {
  return `listening.respondent.submitted.v1.${token.trim()}`;
}

export function classifyListeningPublicError(
  error: unknown
): ListeningPublicErrorView {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(
            (error as { message?: string } | null)?.message ??
              (error as { error?: string } | null)?.error ??
              "unexpected"
          );

  const lower = message.toLowerCase();

  if (
    lower.includes("listening_token_invalid") ||
    lower.includes("token_invalid") ||
    lower.includes("invalid listening") ||
    lower.includes("invalid token")
  ) {
    return {
      kind: "invalid_token",
      title: "Invalid listening link",
      description:
        "This link is not valid. Check the URL or ask the organizer for a new invitation.",
    };
  }

  if (
    lower.includes("listening_campaign_not_open") ||
    lower.includes("campaign_not_open")
  ) {
    // RPC uses one code for closed, not-yet-open, and past closes_at.
    if (lower.includes("expired") || lower.includes("closes")) {
      return {
        kind: "expired",
        title: "This campaign has ended",
        description:
          "The response window is closed. Thank you for your interest.",
      };
    }
    return {
      kind: "closed",
      title: "This campaign is not available",
      description:
        "The listening campaign is closed, expired, or not yet open for responses.",
    };
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("fetch failed")
  ) {
    return {
      kind: "network",
      title: "Connection interrupted",
      description:
        "We could not reach the server. Check your connection and try again. Your answers are saved on this device.",
    };
  }

  if (
    lower.includes("listening_required_missing") ||
    lower.includes("listening_answers_invalid")
  ) {
    return {
      kind: "validation",
      title: "Please review your answers",
      description:
        "Some required questions are missing or invalid. Go back and complete them before submitting.",
    };
  }

  if (lower.includes("listening_token_invalid")) {
    return {
      kind: "invalid_token",
      title: "Invalid listening link",
      description:
        "This link is not valid. Check the URL or ask the organizer for a new invitation.",
    };
  }

  return {
    kind: "unexpected",
    title: "Something went wrong",
    description:
      "An unexpected error occurred. Your draft answers remain on this device. Please try again shortly.",
  };
}

/** Map PostgREST / RPC errors more precisely when message embeds SQL err. */
export function classifyFromRpcError(error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}): ListeningPublicErrorView {
  const blob = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(" ");
  return classifyListeningPublicError(blob);
}

export function toRespondentView(
  contract: ListeningPublicCampaignContract
): ListeningRespondentView {
  const ordered = [...contract.questions].sort(
    (a, b) => a.display_order - b.display_order
  );

  const sectionOrder: string[] = [];
  const sectionMeta = new Map<
    string,
    { title: string; description: string }
  >();

  for (const q of ordered) {
    const cfg = parseQuestionConfig(q.config);
    const sid = cfg.sectionId;
    if (!sid) continue;
    if (!sectionMeta.has(sid)) {
      sectionOrder.push(sid);
      const titleFromConfig =
        typeof q.config?.sectionTitle === "string"
          ? String(q.config.sectionTitle)
          : "";
      const descFromConfig =
        typeof q.config?.sectionDescription === "string"
          ? String(q.config.sectionDescription)
          : "";
      sectionMeta.set(sid, {
        title: titleFromConfig || `Section ${sectionOrder.length}`,
        description: descFromConfig,
      });
    }
  }

  const sections: ListeningRespondentSection[] = sectionOrder.map((id) => {
    const meta = sectionMeta.get(id)!;
    return { id, title: meta.title, description: meta.description };
  });

  const questions: ListeningRespondentQuestion[] = ordered.map((q, index) => {
    const cfg = parseQuestionConfig(q.config);
    return {
      id: q.id,
      number: index + 1,
      prompt: q.prompt,
      helpText: q.help_text,
      required: q.required,
      questionType: q.question_type,
      sectionId: cfg.sectionId ?? null,
      placeholder: cfg.placeholder,
      defaultValue: cfg.defaultValue,
      min: cfg.min,
      max: cfg.max,
      step: cfg.step,
      likertLowLabel: cfg.likertLowLabel,
      likertHighLabel: cfg.likertHighLabel,
      options: [...q.options]
        .sort((a, b) => a.display_order - b.display_order)
        .map((o) => ({
          id: o.id,
          optionKey: o.option_key,
          label: o.label,
          valueNumeric: o.value_numeric,
        })),
    };
  });

  return {
    title: contract.title,
    introduction: contract.introduction,
    privacyStatement: contract.privacy_statement,
    privacyMode: contract.privacy_mode,
    estimatedMinutes: estimateCompletionMinutes(ordered),
    questionCount: questions.length,
    sections,
    questions,
  };
}

export function isAnswerPresent(
  question: ListeningRespondentQuestion,
  raw: unknown
): boolean {
  if (raw === undefined || raw === null || raw === "") return false;
  if (question.questionType === "multi_choice") {
    return Array.isArray(raw) && raw.length > 0;
  }
  if (question.questionType === "numeric" || question.questionType === "likert") {
    if (typeof raw === "number") return !Number.isNaN(raw);
    if (typeof raw === "string" && raw.trim() !== "") {
      return !Number.isNaN(Number(raw));
    }
    return false;
  }
  if (typeof raw === "string") return raw.trim().length > 0;
  return true;
}

export function validateRequiredAnswers(
  questions: readonly ListeningRespondentQuestion[],
  answers: ListeningDraftAnswers
): { ok: true } | { ok: false; missingIds: string[]; message: string } {
  const missingIds = questions
    .filter((q) => q.required && !isAnswerPresent(q, answers[q.id]))
    .map((q) => q.id);
  if (missingIds.length === 0) return { ok: true };
  return {
    ok: false,
    missingIds,
    message: "Please answer all required questions before continuing.",
  };
}

export function validateCurrentQuestion(
  question: ListeningRespondentQuestion,
  raw: unknown
): { ok: true } | { ok: false; message: string } {
  if (question.required && !isAnswerPresent(question, raw)) {
    return { ok: false, message: "This question is required." };
  }
  if (
    question.questionType === "numeric" &&
    isAnswerPresent(question, raw)
  ) {
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isNaN(n)) {
      return { ok: false, message: "Enter a valid number." };
    }
    if (question.min != null && n < question.min) {
      return { ok: false, message: `Minimum is ${question.min}.` };
    }
    if (question.max != null && n > question.max) {
      return { ok: false, message: `Maximum is ${question.max}.` };
    }
  }
  return { ok: true };
}

export function toSubmitAnswers(
  questions: readonly ListeningRespondentQuestion[],
  answers: ListeningDraftAnswers
): ListeningSubmitAnswerInput[] {
  const out: ListeningSubmitAnswerInput[] = [];
  for (const q of questions) {
    const raw = answers[q.id];
    if (!isAnswerPresent(q, raw)) continue;
    const value = toAnswerValue(q, raw);
    if (value) out.push({ question_id: q.id, value });
  }
  return out;
}

function toAnswerValue(
  question: ListeningRespondentQuestion,
  raw: unknown
): ListeningAnswerValue | null {
  switch (question.questionType) {
    case "short_text":
    case "long_text":
      return { text: String(raw).trim() };
    case "single_choice": {
      const key = String(raw);
      return { option_key: key };
    }
    case "multi_choice": {
      const keys = Array.isArray(raw) ? raw.map(String) : [];
      return { option_keys: keys };
    }
    case "likert": {
      const key = String(raw);
      const opt = question.options.find((o) => o.optionKey === key);
      const num =
        opt?.valueNumeric ??
        question.options.findIndex((o) => o.optionKey === key) + 1;
      return { number: Number(num) };
    }
    case "numeric":
      return { number: typeof raw === "number" ? raw : Number(raw) };
    default:
      return null;
  }
}

export function seedDraftFromDefaults(
  questions: readonly ListeningRespondentQuestion[]
): ListeningDraftAnswers {
  const draft: ListeningDraftAnswers = {};
  for (const q of questions) {
    if (q.defaultValue !== undefined && q.defaultValue !== null && q.defaultValue !== "") {
      draft[q.id] = q.defaultValue;
    }
  }
  return draft;
}

export function readDraftFromStorage(
  token: string
): ListeningDraftAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftStorageKey(token));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ListeningDraftAnswers;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDraftToStorage(
  token: string,
  answers: ListeningDraftAnswers
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      draftStorageKey(token),
      JSON.stringify(answers)
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearDraftStorage(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftStorageKey(token));
  } catch {
    /* ignore */
  }
}

export function markSubmittedLocally(
  token: string,
  payload: { title: string; privacyStatement: string }
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      submittedStorageKey(token),
      JSON.stringify({ ...payload, at: new Date().toISOString() })
    );
  } catch {
    /* ignore */
  }
}

export function readSubmittedLocally(
  token: string
): { title: string; privacyStatement: string; at: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(submittedStorageKey(token));
    if (!raw) return null;
    return JSON.parse(raw) as {
      title: string;
      privacyStatement: string;
      at: string;
    };
  } catch {
    return null;
  }
}

/** Expose for tests — map public questions through view builder. */
export function questionsFromContract(
  questions: readonly ListeningPublicQuestion[]
): readonly ListeningRespondentQuestion[] {
  return toRespondentView({
    campaign_id: "00000000-0000-4000-8000-000000000000",
    title: "t",
    introduction: "",
    privacy_statement: "",
    privacy_mode: "anonymous",
    instrument_version_id: "00000000-0000-4000-8000-000000000001",
    questions,
  }).questions;
}
