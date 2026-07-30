/**
 * ExplainabilityRegistry — subject explainers — Sprint 208.
 */

import type { Explanation } from "./types";
import type { ExplainNodeKind } from "./types";

export type ExplanationSubject = {
  readonly id: string;
  readonly kind: ExplainNodeKind;
  readonly organizationId: string | null;
  readonly organizationName?: string;
  readonly title: string;
  readonly summary: string;
  readonly confidence?: number;
  readonly createdBy?: string;
  readonly createdAt?: string;
  readonly href?: string;
  readonly evidence?: readonly { id: string; source: string; summary: string }[];
  readonly policies?: readonly string[];
  readonly forecasts?: readonly string[];
  readonly scenarios?: readonly string[];
  readonly memory?: readonly string[];
  readonly goals?: readonly string[];
  readonly decisions?: readonly string[];
  readonly outcomes?: readonly string[];
  readonly contributors?: readonly string[];
  readonly assumptions?: readonly string[];
  readonly drivers?: readonly string[];
  readonly timeline?: readonly { at: string; message: string }[];
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, string>>;
};

export type SubjectExplainer = {
  readonly kind: ExplainNodeKind;
  readonly explain: (subject: ExplanationSubject) => Explanation;
};

const explainers = new Map<ExplainNodeKind, SubjectExplainer>();

export const ExplainabilityRegistry = {
  register(explainer: SubjectExplainer): void {
    explainers.set(explainer.kind, explainer);
  },

  get(kind: ExplainNodeKind): SubjectExplainer | null {
    return explainers.get(kind) ?? null;
  },

  listKinds(): readonly ExplainNodeKind[] {
    return [...explainers.keys()];
  },

  resetForTests(): void {
    explainers.clear();
  },
} as const;
