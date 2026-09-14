import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Never decide about a child on evidence you failed to read.
 *
 * Four reads — documents, state funding verifications, the scholarship, and its
 * documents — are loaded on the application page and at three points in
 * actions.ts. From there they go into computeAdmissionsProgress and into
 * runAutomatedAcceptanceWorkflow, which decides whether a child is accepted.
 *
 * Until 14 September every one of them discarded its error and returned an
 * empty array. At the point of decision that is indistinguishable from a family
 * who uploaded nothing. The failure mode was not an empty list on a screen; it
 * was an automated admissions decision taken on evidence nobody had seen, and a
 * progress bar telling a family to re-upload documents that were already there.
 *
 * Asked of production on 14 September: every one of those tables HAS a guardian
 * SELECT policy, all resting on is_guardian_of_lead, which was SECURITY INVOKER
 * and therefore recursing until migration 350. So these reads should now
 * succeed — and "should" is not a basis for an admissions decision.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const code = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const queries = code(read("src/lib/admissions/portal/queries.ts"));
const actions = code(read("src/lib/admissions/portal/actions.ts"));
const page = code(read("src/app/apply/portal/[applicationId]/page.tsx"));

describe("each read reports whether it failed", () => {
  it("returns a result rather than a bare array", () => {
    for (const fn of [
      "getApplicationDocuments",
      "getStateFundingVerifications",
      "getScholarshipForApplication",
      "getScholarshipDocuments",
    ]) {
      expect(queries).toMatch(new RegExp(`${fn}[\\s\\S]{0,220}Promise<PortalRead<`));
    }
  });

  it("derives failed from the error rather than assuming success", () => {
    const occurrences = queries.match(/failed: Boolean\(error\)/g) ?? [];
    expect(occurrences.length).toBe(4);
  });

  it("still returns the rows it did get, so a partial page can render", () => {
    expect(queries).toContain("data: (data ?? []) as PortalApplicationDocument[]");
  });
});

describe("the four are loaded together, with their failures", () => {
  it("names each failed read in plain words, not a boolean", () => {
    expect(queries).toContain('documents.failed ? "documents" : null');
    expect(queries).toContain('verifications.failed ? "state funding verifications" : null');
    expect(queries).toContain('scholarship.failed ? "scholarship" : null');
    expect(queries).toContain('scholarshipDocuments.failed ? "scholarship documents" : null');
  });

  /**
   * Not applicable is not the same as failed. There are no scholarship documents
   * to read when there is no scholarship, and recording that as a failure would
   * block every application that never applied for one.
   */
  it("does not count an absent scholarship as a failed read", () => {
    expect(queries).toMatch(
      /scholarship\.data[\s\S]{0,160}failed: false/
    );
  });

  it("logs which reads failed, so the next one is diagnosable", () => {
    expect(queries).toMatch(/could not read \$\{failedReads\.join/);
  });
});

describe("nothing decides on incomplete evidence", () => {
  /** THE ONE THAT MATTERS. Three call sites, three refusals. */
  it("guards all three places the acceptance workflow is reached from", () => {
    const guards = actions.match(/if \(evidence\.failedReads\.length\)/g) ?? [];
    expect(guards.length).toBe(3);
  });

  it("submitApplication refuses rather than submitting", () => {
    const start = actions.indexOf("export async function submitApplication");
    const body = actions.slice(start, start + 2000);
    expect(body).toContain("if (evidence.failedReads.length)");
    // The refusal must come before the row is updated.
    expect(body.indexOf("if (evidence.failedReads.length)")).toBeLessThan(
      body.indexOf('application_status: "submitted"')
    );
  });

  it("the void hook stops and says so, having nowhere to report", () => {
    expect(actions).toMatch(/acceptance workflow skipped for \$\{applicationId\}/);
  });

  it("the staff check reports the refusal to a person who can act on it", () => {
    expect(actions).toMatch(/no acceptance check was run/);
  });

  /**
   * A family told "nothing you have uploaded is lost" can wait. A family told
   * nothing at all re-uploads, or gives up.
   */
  it("tells the family their work is safe", () => {
    expect(actions).toContain("Nothing you have uploaded is lost");
  });
});

describe("the page does not show a percentage it cannot stand behind", () => {
  it("knows when the evidence is incomplete", () => {
    expect(page).toContain("const evidenceIncomplete = evidence.failedReads.length > 0");
  });

  it("says so before anything computed from it", () => {
    const banner = page.indexOf("evidenceIncomplete ?");
    const progress = page.indexOf("computeAdmissionsProgress");
    expect(banner).toBeGreaterThan(-1);
    expect(progress).toBeGreaterThan(-1);
    // The banner renders above the rest of the page body.
    expect(page.indexOf("We could not load part of this application")).toBeGreaterThan(-1);
  });

  it("loads once rather than four times with four chances to drop an error", () => {
    expect(page).toContain("loadApplicationEvidence(applicationId)");
    expect(page).not.toContain("getApplicationDocuments(");
    expect(page).not.toContain("getStateFundingVerifications(");
  });
});
