import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MERGE_FIELDS } from "@/lib/admissions/communications/types";

/**
 * EVERY TOKEN A TEMPLATE USES MUST EXIST.
 *
 * renderTemplate leaves an unresolved token in place AS LITERAL TEXT. That is
 * deliberate - a missing booking link should be visible rather than silent -
 * and it means a template naming a field the renderer does not have sends the
 * characters {{like_this}} to whoever receives it.
 *
 * It has already happened once. Migration 294 seeded four live parent-reminder
 * templates written against placeholder names that read naturally and were not
 * in MERGE_FIELDS. Three families were about forty-eight hours from:
 *
 *     Congratulations again on {{student_first_name}}'s place at The Academy GA
 *
 * Caught by hand on 7 September 2026; all 20 templates deactivated that night,
 * and migration 296 is the audit that found them.
 *
 * It nearly happened again on 17 September, in the other direction: the staff
 * inquiry template was updated in production to use {{attachment_note}} before
 * the code defining that token had shipped. tsc caught it, because MERGE_FIELDS
 * is a closed union - but only after the database was already changed. A
 * database can be updated in a second and a deploy cannot, so the check belongs
 * HERE, in the repository, before the SQL is ever run.
 */

const root = join(__dirname, "..", "..", "..");
const migrations = join(root, "supabase", "migrations");

/**
 * Tokens that migration 296 found, named and left behind on purpose.
 *
 * They appear in migration 294's template bodies. 296 set every one of those
 * templates is_active = false rather than rewriting history, and documents why
 * these three cannot be satisfied by adding a merge field. Re-litigating a
 * closed incident on every run is how a gate becomes noise, so they are named
 * here with their reason instead of quietly skipped.
 */
const RETIRED_BY_MIGRATION_296 = new Set([
  "wait_description",
  "waiting_since",
  "reminder_dates",
]);

/** Every {{token}} in a SQL file that writes a template body. Comments removed:
    migration 296 discusses these tokens in prose, and a line of commentary
    about a bug is not the bug. */
function tokensInMigrations(): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();

  for (const file of readdirSync(migrations).filter((f) => f.endsWith(".sql"))) {
    const sql = readFileSync(join(migrations, file), "utf8");
    if (!/admissions_communication_templates/i.test(sql)) continue;

    const withoutComments = sql.replace(/--[^\n]*/g, "");
    for (const m of withoutComments.matchAll(/\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi)) {
      const token = m[1];
      if (!found.has(token)) found.set(token, new Set());
      found.get(token)!.add(file);
    }
  }
  return found;
}

describe("template tokens", () => {
  const known = new Set<string>(MERGE_FIELDS);
  const used = tokensInMigrations();

  it("finds tokens to check", () => {
    expect(used.size).toBeGreaterThan(10);
  });

  /** THE ONE THAT MATTERS. */
  it("are all known to the renderer", () => {
    const unknown = [...used.entries()]
      .filter(([token]) => !known.has(token) && !RETIRED_BY_MIGRATION_296.has(token))
      .map(([token, files]) => `${token} (${[...files].sort().join(", ")})`);

    expect(
      unknown,
      "a template references a token the renderer cannot resolve — it will render as literal {{text}} to whoever receives it"
    ).toEqual([]);
  });

  it("includes attachment_note", () => {
    expect(known.has("attachment_note")).toBe(true);
  });

  /**
   * The allowlist is for a closed incident, not a parking space. If one of
   * these ever becomes a real merge field, delete it from the list - otherwise
   * the next person reads the list as "these are fine" rather than "these are
   * why twenty templates are switched off".
   */
  it("keeps the retired list honest", () => {
    for (const token of RETIRED_BY_MIGRATION_296) {
      expect(
        known.has(token),
        `${token} is a real merge field now — remove it from RETIRED_BY_MIGRATION_296`
      ).toBe(false);
    }
  });
});
