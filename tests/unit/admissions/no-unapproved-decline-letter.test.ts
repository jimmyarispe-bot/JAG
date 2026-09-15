import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildAdmissionsDecisionEmail } from "@/lib/branding/templates";
import type { OrganizationBranding } from "@/lib/branding/types";

/**
 * Nobody approved two of the three decline letters, and both were sending.
 *
 * Jimmy, 15 September 2026: "delete these. never approved these."
 *
 *   application_declined_email   migration 247. HIS. "It is not a negative
 *                                reflection on {{student_name}}. It reflects
 *                                our school's inability to provide the support
 *                                {{student_name}} needs to be successful here."
 *                                Gate 2's no. Stays.
 *
 *   student_declined_email       migration 068. Seed data. "We are unable to
 *                                offer enrollment... You may reapply in a
 *                                future enrollment period." DELETED by 366.
 *
 *   buildAdmissionsDecisionEmail src/lib/branding/templates.ts. A third copy,
 *                                in TypeScript. DELETED here.
 *
 * AND THE FIRST READING OF THIS WAS WRONG, WHICH IS WHY THE TEST EXISTS.
 *
 * Gate 3 dispatches the event `declined`; templates are keyed `student_declined`.
 * That looks like a dead end and was reported as one — the family gets nothing.
 * It is not. LEGACY_EVENT_MAP in automation/dispatch.ts maps declined ->
 * student_declined, so the unapproved letter was reaching real families while
 * email_sent_at recorded it truthfully.
 *
 * A name mismatch is not proof of a dead path. Find the mapping layer first.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

const BRANDING = { productName: "The Academy GA" } as OrganizationBranding;

describe("there is no decline letter in code", () => {
  /** THE ONE THAT MATTERS. Null, not a plausible sentence. */
  it("returns null for a denial rather than inventing wording", () => {
    expect(buildAdmissionsDecisionEmail("deny", "A Child", BRANDING)).toBeNull();
  });

  it("returns null even when notes are supplied", () => {
    expect(buildAdmissionsDecisionEmail("deny", "A Child", BRANDING, "some note")).toBeNull();
  });

  it("carries none of the deleted wording anywhere in the file", () => {
    const src = read("src/lib/branding/templates.ts");
    for (const phrase of [
      "unable to offer enrollment",
      "reapply in a future enrollment period",
    ]) {
      // Allowed in the comment that records WHY it was removed, but not as a
      // template body — so check the code with comments stripped.
      const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      expect(code, phrase).not.toContain(phrase);
    }
  });

  /** The other three decisions are untouched — this was not a cull. */
  it("still builds accept, waitlist and request_info", () => {
    for (const kind of ["accept", "waitlist", "request_info"] as const) {
      const email = buildAdmissionsDecisionEmail(kind, "A Child", BRANDING);
      expect(email, kind).not.toBeNull();
      expect(email!.subject.length, kind).toBeGreaterThan(5);
    }
  });
});

describe("a letter that does not exist is never recorded as sent", () => {
  const code = read("src/lib/admissions/decisions.ts")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  /**
   * email_sent_at used to be stamped from `sendEmail` alone — the caller's
   * intention, not the outcome. On a decline that is the most expensive
   * possible lie, because the decision record is the only evidence anyone
   * would ever look at.
   */
  it("gates the timestamp on an approved letter existing, not on the request", () => {
    expect(code).toContain("const hasApprovedLetter = email !== null");
    expect(code).toContain("const willEmailFamily = sendEmail && hasApprovedLetter");
    expect(code).toMatch(/email_sent_at:\s*willEmailFamily\s*\?/);
  });

  it("does not dispatch to the family either", () => {
    expect(code).toMatch(/if \(willEmailFamily\) \{[\s\S]{0,120}onDecisionSubmitted/);
  });

  it("writes the gap into the audit trail instead of leaving it to be inferred", () => {
    expect(code).toContain("emailedFamily: willEmailFamily");
    expect(code).toContain("noApprovedLetter");
  });

  /** The decision itself is still recorded — this removes a letter, not a decision. */
  it("still records the decision and moves the stage", () => {
    expect(code).toContain("admissions_decisions");
    expect(code).toContain("transitionCaseStage");
  });
});

describe("migration 366 keeps what it deletes", () => {
  const sql = read("supabase/migrations/366_delete_the_unapproved_decline_letters_2026_09_15.sql")
    .replace(/--.*$/gm, "");

  it("copies the letter aside before removing it", () => {
    const copyAt = sql.indexOf("insert into public.admissions_retired_templates");
    const deleteAt = sql.indexOf("delete from public.admissions_communication_templates");
    expect(copyAt).toBeGreaterThan(-1);
    expect(deleteAt).toBeGreaterThan(copyAt);
  });

  it("deletes only the unapproved one", () => {
    expect(sql).toMatch(/delete from public\.admissions_communication_templates\s*where template_key = 'student_declined_email'/);
    expect(sql).not.toContain("delete from public.admissions_communication_templates\nwhere template_key = 'application_declined_email'");
  });

  /** Jimmy's letter must survive this migration untouched. */
  it("never touches the approved letter", () => {
    const destructive = sql.match(/(delete|update)[\s\S]{0,200}application_declined_email/gi);
    expect(destructive).toBeNull();
  });
});
