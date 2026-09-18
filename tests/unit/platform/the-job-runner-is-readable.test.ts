import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * THE JOB RUNNER'S RECORD OF ITSELF IS READ BY SOMETHING.
 *
 * platform_job_runs carries this comment, from migration 289:
 *
 *   "Exists because the runner spent months reporting success while doing
 *    nothing, and nothing recorded enough to notice."
 *
 * The table was built. The runner writes to it on every execution. Nothing
 * ever read it back, so "did the nightly job run?" stayed exactly as
 * unanswerable as before - the evidence was being collected into a room with
 * no door, and fifteen runs were sitting in there when the seam audit found it
 * on 17 September 2026.
 *
 * Source assertions: the fault was an absence. There was no wrong value, only
 * a reader nobody had written.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

const reader = read("src/lib/platform/automation/job-runs.ts");
const panel = read("src/components/platform/JobRunsPanel.tsx");
const page = read("src/app/dashboard/mission-control/page.tsx");

describe("the job runner's history", () => {
  it("is read from the table the runner writes to", () => {
    expect(reader).toContain('from("platform_job_runs")');
  });

  it("is newest first", () => {
    expect(reader).toContain('order("ran_at", { ascending: false })');
  });

  /**
   * A policy refusal resolves rather than throwing. Reporting one as "no runs
   * recorded" would be the same silent empty this table exists to expose - on
   * the one screen built to notice it.
   */
  it("distinguishes a failed read from an empty table", () => {
    expect(reader).toContain("unavailable");
    expect(panel).toContain("could not be read");
  });

  /** A table that has only ever been empty is the loudest possible answer. */
  it("treats never having run as stale", () => {
    expect(reader).toContain("hoursSinceLastRun === null");
    expect(panel).toContain("No run has ever been recorded");
  });

  /** Knowing three jobs failed is not knowing which. */
  it("names the jobs that failed", () => {
    expect(panel).toContain("failure.name");
  });
});

describe("somewhere a person will see it", () => {
  it("is mounted on Mission Control", () => {
    expect(
      page,
      "the job run history is read by nothing again"
    ).toContain("<JobRunsPanel />");
  });
});
