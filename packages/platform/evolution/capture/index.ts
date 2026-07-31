/**
 * Capture — natural-language "Teach JAG" / wish statements.
 */

import { randomUUID } from "node:crypto";
import { upsertRequest } from "../store";
import type { EvolutionCaptureRequest } from "../types";

const WISH_PREFIXES = [
  /^i wish you could\b/i,
  /^i wish jag\b/i,
  /^it would help if\b/i,
  /^i need\b/i,
  /^teach jag\b/i,
];

export function isTeachJagUtterance(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (WISH_PREFIXES.some((re) => re.test(t))) return true;
  if (/💡|teach\s+jag/i.test(t)) return true;
  return t.length >= 12;
}

function deriveTitle(text: string): string {
  const cleaned = text
    .replace(/^💡\s*/, "")
    .replace(/^(i wish you could|i wish jag|it would help if|i need|teach jag)\s*/i, "")
    .trim();
  const sentence = cleaned.split(/[.!?]/)[0]?.trim() || cleaned;
  if (sentence.length <= 80) return sentence || "Evolution idea";
  return `${sentence.slice(0, 77)}…`;
}

export function captureEvolutionRequest(input: {
  text: string;
  organizationId: string;
  userId: string;
  persona?: string | null;
  product?: string | null;
  page?: string | null;
  workflow?: string | null;
  title?: string | null;
}): EvolutionCaptureRequest {
  const rawText = input.text.trim();
  const request: EvolutionCaptureRequest = {
    requestId: `evo:${randomUUID()}`,
    title: (input.title?.trim() || deriveTitle(rawText)).trim(),
    description: rawText,
    rawText,
    persona: input.persona?.trim() || "Executive",
    organizationId: input.organizationId,
    userId: input.userId,
    product: input.product ?? null,
    page: input.page ?? null,
    workflow: input.workflow ?? null,
    timestamp: new Date().toISOString(),
    attachments: Object.freeze([]),
    status: "captured",
  };
  return upsertRequest(request);
}
