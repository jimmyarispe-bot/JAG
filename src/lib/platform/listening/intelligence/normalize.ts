/**
 * Deterministic text normalization for Listening Intelligence.
 */

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "this",
  "that",
  "with",
  "as",
  "at",
  "by",
  "from",
  "we",
  "our",
  "they",
  "i",
  "me",
  "my",
  "you",
  "your",
]);

/** Very small suffix stemmer — replaceable by NLP later. */
export function lightStem(token: string): string {
  const t = token.toLowerCase();
  if (t.length <= 3) return t;
  if (t.endsWith("ing") && t.length > 5) return t.slice(0, -3);
  if (t.endsWith("ed") && t.length > 4) return t.slice(0, -2);
  if (t.endsWith("es") && t.length > 4) return t.slice(0, -2);
  if (t.endsWith("s") && !t.endsWith("ss") && t.length > 3) return t.slice(0, -1);
  return t;
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function normalizeListeningText(raw: string): {
  normalized: string;
  tokens: string[];
} {
  const collapsed = normalizeWhitespace(raw).toLowerCase();
  const tokens = collapsed
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^'+|'+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map(lightStem);
  return {
    normalized: collapsed,
    tokens,
  };
}

export function extractTextFromAnswerValue(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.text === "string") return v.text;
  return null;
}

export function extractNumberFromAnswerValue(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const n = (value as { number?: unknown }).number;
  return typeof n === "number" && !Number.isNaN(n) ? n : null;
}

export function extractOptionKey(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const key = (value as { option_key?: unknown }).option_key;
  return typeof key === "string" ? key : null;
}

export function extractOptionKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const keys = (value as { option_keys?: unknown }).option_keys;
  if (!Array.isArray(keys)) return [];
  return keys.map(String);
}
