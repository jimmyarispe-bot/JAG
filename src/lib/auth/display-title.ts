/**
 * Personal display titles (UI only) — not roles / permissions.
 * Danni Treu keeps the CEO role for authorization; her chrome title differs.
 */

export const DANNI_TREU_DISPLAY_TITLE = "Executive Director of Schools";

const PERSONAL_TITLE_BY_EMAIL: ReadonlyMap<string, string> = new Map([
  ["danni@theacademyway.org", DANNI_TREU_DISPLAY_TITLE],
  ["danni@academyos.org", DANNI_TREU_DISPLAY_TITLE],
]);

/** Returns a person-specific display title when one is defined for this email. */
export function resolvePersonalDisplayTitle(
  email: string,
  metadataTitle?: string | null
): string {
  const normalized = email.trim().toLowerCase();
  const override = PERSONAL_TITLE_BY_EMAIL.get(normalized);
  if (override) return override;
  return typeof metadataTitle === "string" ? metadataTitle.trim() : "";
}
