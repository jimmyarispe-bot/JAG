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
  /*
   * THE FILE MOVED ON 14 OCTOBER 2026 AND THIS TEST MOVED WITH IT.
   *
   * submitAdmissionsDecision's body is now applyAdmissionsDecision in
   * decisions-core.ts, word for word, so that the shadow day's notes letter -
   * a page with no signed-in session - can run the same decision the gate
   * runs. decisions.ts keeps the permission check and the FormData.
   *
   * These five assertions read source text, so a move silently empties them.
   * They did not go quiet: reading decisions.ts for "hasApprovedLetter" after
   * the move FAILED, loudly, which is why they are repointed here rather than
   * found hollow in a month. The delegation test below is what stops the same
   * thing happening the next time somebody moves it.
   */
  const code = read("src/lib/admissions/decisions-core.ts")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  /**
   * email_sent_at used to be stamped from `sendEmail` alone — the caller's
   * intention, not the outcome. On a decline that is the most expensive
   * possible lie, because the decision record is the only evidence anyone
   * would ever look at.
   */
  it("gates the timestamp on a letter existing, not on the request", () => {
    /*
     * THIS ASSERTION GOT ONE TERM WIDER ON 14 OCTOBER, AND NO WEAKER.
     *
     * It read `sendEmail && hasApprovedLetter`. A denial after shadow days now
     * has a letter - migration 554, Jimmy's own words - so the condition is
     * `sendEmail && (hasApprovedLetter || denialLetterIsTrue)`.
     *
     * The rule it protects is unchanged and is the only thing that matters:
     * email_sent_at is stamped when a letter EXISTS, never because a caller
     * asked for one. Before this guard was written the timestamp came off
     * `sendEmail` alone - the intention, not the outcome - which on a decline
     * is the most expensive possible lie, because the decision record is the
     * only evidence anybody would ever check.
     */
    expect(code).toContain("const hasApprovedLetter = email !== null");
    expect(code).toContain(
      "const willEmailFamily = sendEmail && (hasApprovedLetter || denialLetterIsTrue)"
    );
    expect(code).toMatch(/email_sent_at:\s*willEmailFamily\s*\?/);
  });

  it("does not dispatch to the family either", () => {
    expect(code).toMatch(/if \(willEmailFamily\) \{[\s\S]{0,120}onDecisionSubmitted/);
  });

  it("only calls a denial's letter true when a shadow day was actually held", () => {
    /*
     * THE SENTENCE THAT COULD BE FALSE, AND WHAT STOPS IT.
     *
     * 554's letter opens "Thank you for spending the last two days with us."
     * LEGACY_EVENT_MAP sends every `declined` to `student_declined`, and three
     * things produce a `declined`: the shadow day letter's Deny button, the
     * accept_or_deny gate's deny branch, and the DecisionWizard on the
     * decisions board. The first two only ever happen at shadow_day_completed.
     * The Wizard can be used at any stage.
     *
     * So the dispatch is gated on a COMPLETED row in admissions_shadow_days,
     * read fresh - not inferred from the lead stage, which by that point in the
     * function is about to become `declined` and answers the wrong question.
     *
     * Remove this and a family who never visited gets thanked for two days they
     * never spent. That is the failure this whole file exists to prevent, one
     * letter further down the chain.
     */
    expect(code).toContain("admissions_shadow_days");
    expect(code).toMatch(/shadow_day_status[\s\S]{0,40}completed/);
    expect(code).toMatch(/decisionType === "deny"/);
    /* And it fails CLOSED: a failed read sends nothing. */
    expect(code).toContain("let denialLetterIsTrue = false");
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

  /**
   * THE DOOR STILL LEADS TO THE SAME ROOM.
   *
   * Everything above checks the core. This checks that the thing the
   * decisions board actually calls still runs it, and does not grow a second
   * copy of an acceptance with its own ideas about letters. If someone
   * reinstates the body in decisions.ts, the assertions above start reading a
   * file nobody calls - and this one is what notices.
   */
  it("is what the signed-in action and the gate both run", () => {
    const action = read("src/lib/admissions/decisions.ts");
    expect(action).toContain("applyAdmissionsDecision");
    expect(action).toContain("assertAnyPermission");
    /* The work is delegated, not duplicated: the action keeps no decision
       logic of its own. */
    expect(action).not.toContain("admissions_decisions");
    expect(action).not.toContain("hasApprovedLetter");
  });

  /**
   * AND THE BUTTON IN THE LETTER RUNS IT TOO.
   *
   * Jimmy, 14 October: "let's make the buttons this - accept-send email,
   * deny-send email". Two doors onto one decision must not do two different
   * things, so the shadow day page delegates here rather than sending its own
   * acceptance - which would be a second place a letter is decided.
   */
  it("is also what the shadow day's Accept button runs", () => {
    const page = read("src/lib/admissions/automation/post-call.ts");
    expect(page).toContain("applyAdmissionsDecision");
    expect(page).not.toContain("buildAdmissionsDecisionEmail");
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
