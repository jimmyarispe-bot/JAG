import { describe, expect, it } from "vitest";
import { ADMISSIONS_CASE_PROFILE_SECTIONS } from "@/lib/admissions/profile/sections";
import { ADMISSIONS_CASE_PROFILE_KIND } from "@/lib/admissions/profile/kind";

/**
 * THE TABS ON A CHILD'S CARD RUN IN THE ORDER THE WORK RUNS.
 *
 * They used to run in group order, because navigation.ts read tab order out of
 * the group taxonomy. Financial sorts before operations, so the card opened
 * Overview, then Scholarships & Funding, then jumped back to Pipeline, and the
 * interest form - the first thing that happens to a family - sat thirteenth,
 * after Activity. Nobody works a case in that order.
 *
 * Two things have to hold, and the second is the one that will break.
 *
 *   1. sortOrder says the right order.
 *   2. Something actually READS sortOrder.
 *
 * (2) is only true while the kind declares tabOrder: "flat". Set it back to
 * grouped, or drop the field, and every number below becomes decoration - the
 * strip silently returns to group order and every test about (1) still passes.
 * That is the seam, so it is tested first.
 */

const PROCESS = [
  "overview",
  "pipeline",
  "interest_form",
  "prospect",
  "student_questionnaire",
  "visits",
  "applications",
  "documents",
  "decisions",
  "scholarships",
  "enrollment",
];

/** Everything that is not a step of the process, alphabetically BY LABEL. */
const REST = ["activity", "communications", "notes", "relationships", "tasks"];

const TAIL_STARTS_AT = 200;

function byKey(key: string) {
  const section = ADMISSIONS_CASE_PROFILE_SECTIONS.find((s) => s.key === key);
  if (!section) throw new Error(`no ${key} section registered`);
  return section;
}

describe("the wire", () => {
  /** Without this, nothing below means anything. */
  it("the admissions case orders its tabs flat, not by group", () => {
    expect(
      ADMISSIONS_CASE_PROFILE_KIND.tabOrder,
      'the case tab strip is back on group order — sortOrder in sections.ts is being ignored'
    ).toBe("flat");
  });
});

describe("tab order", () => {
  const ordered = [...ADMISSIONS_CASE_PROFILE_SECTIONS].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)
  );

  it("accounts for every registered section", () => {
    expect([...PROCESS, ...REST].sort()).toEqual(
      ADMISSIONS_CASE_PROFILE_SECTIONS.map((s) => s.key).sort()
    );
  });

  it("runs the admissions process in order, then everything else", () => {
    expect(ordered.map((s) => s.key)).toEqual([...PROCESS, ...REST]);
  });

  it("starts on Overview", () => {
    expect(ordered[0]?.key).toBe("overview");
    expect(byKey("overview").pinned).toBe(true);
  });

  /** The specific complaint: money opened the card. */
  it("does not put Scholarships & Funding second", () => {
    expect(ordered[1]?.key).not.toBe("scholarships");
  });

  /** The other specific complaint: the inquiry was thirteenth. */
  it("puts the interest form in the first half of the strip", () => {
    const position = ordered.findIndex((s) => s.key === "interest_form");
    expect(position).toBeGreaterThan(-1);
    expect(position).toBeLessThan(ordered.length / 2);
  });

  it("keeps a document's story in order: apply, then send, then decide", () => {
    const at = (key: string) => ordered.findIndex((s) => s.key === key);
    expect(at("applications")).toBeLessThan(at("documents"));
    expect(at("documents")).toBeLessThan(at("decisions"));
    expect(at("decisions")).toBeLessThan(at("enrollment"));
    expect(at("visits")).toBeLessThan(at("applications"));
  });
});

describe("the tail", () => {
  it("is alphabetical by label", () => {
    const tail = [...ADMISSIONS_CASE_PROFILE_SECTIONS]
      .filter((s) => s.sortOrder >= TAIL_STARTS_AT)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const labels = tail.map((s) => s.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it("holds exactly the sections that are not process steps", () => {
    const tail = ADMISSIONS_CASE_PROFILE_SECTIONS.filter(
      (s) => s.sortOrder >= TAIL_STARTS_AT
    ).map((s) => s.key);
    expect(tail.sort()).toEqual([...REST].sort());
  });

  /** A new section dropped in with a copy-pasted number lands mid-process. */
  it("leaves a clear gap between the process and the tail", () => {
    const lastProcess = Math.max(
      ...ADMISSIONS_CASE_PROFILE_SECTIONS.filter(
        (s) => s.sortOrder < TAIL_STARTS_AT
      ).map((s) => s.sortOrder)
    );
    expect(TAIL_STARTS_AT - lastProcess).toBeGreaterThanOrEqual(50);
  });

  it("gives every section its own number", () => {
    const orders = ADMISSIONS_CASE_PROFILE_SECTIONS.map((s) => s.sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });
});
