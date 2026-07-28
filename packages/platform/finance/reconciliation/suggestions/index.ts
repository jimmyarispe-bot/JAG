import { clearSuggestions, listSuggestions, upsertSuggestion } from "../store";
import { generateMatchSuggestions, matchedIdSets } from "../matching";
import { listMatches } from "../store";
import type { MatchSuggestion } from "../types";
import { getPeriod } from "../store";

export function refreshSuggestions(input: {
  organizationId: string;
  periodId: string;
}):
  | {
      suggestions: readonly MatchSuggestion[];
      duplicates: readonly { a: string; b: string }[];
      recurring: readonly { pattern: string; ids: string[] }[];
    }
  | { error: string } {
  const period = getPeriod(input.periodId);
  if (!period || period.organizationId !== input.organizationId) {
    return { error: "Period not found." };
  }
  if (period.status === "closed") return { error: "Period is closed." };

  const { bank, book } = matchedIdSets(
    listMatches(input.organizationId, input.periodId)
  );
  clearSuggestions(input.periodId);
  const generated = generateMatchSuggestions({
    organizationId: input.organizationId,
    periodId: input.periodId,
    bankAccountId: period.bankAccountId,
    matchedBankIds: bank,
    matchedBookIds: book,
  });
  for (const s of generated.suggestions) {
    upsertSuggestion(s);
  }
  return {
    suggestions: listSuggestions(input.organizationId, input.periodId),
    duplicates: generated.duplicates,
    recurring: generated.recurring,
  };
}

export { listSuggestions };
