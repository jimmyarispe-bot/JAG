import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { programLabel } from "@/lib/constants/programs";

/**
 * A lead card must never be blank where staff read the campus.
 *
 * Both boards rendered one line, `lead.program`, wrapped in `{lead.program && …}`
 * so it disappeared entirely when null. Since 9 September (1f2cda2) the public
 * inquiry form archives programmes of interest on the interest answers and
 * deliberately writes `p_program: null` on the lead — a family may tick more
 * than one, and collapsing them onto a single column would pick a winner nobody
 * chose. Every inquiry taken since has shown a blank there.
 *
 * Confirmed against production on 14 September: six leads created 10-14
 * September, all with a school, all with program null; nine created 7-8
 * September, all with both.
 *
 * The campus was never missing. submit_public_admissions_inquiry raises
 * 'school_id is required' and checks the id exists before creating the row, so a
 * lead without a school cannot exist. The boards simply never displayed it,
 * though queries.ts has always fetched it — select("*, schools(name)").
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
/** Assert on code, not on the comments that describe it. */
const code = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const boards = {
  "AdmissionsPipelineBoard.tsx": code(read("src/components/admissions/AdmissionsPipelineBoard.tsx")),
  "KanbanBoard.tsx": code(read("src/components/admissions/KanbanBoard.tsx")),
};
const queries = code(read("src/lib/admissions/queries.ts"));
const submit = code(read("src/lib/admissions/interest-form/submit.ts"));

describe("every board card shows a campus", () => {
  for (const [name, src] of Object.entries(boards)) {
    /** THE ONE THAT MATTERS. The guard is what made the line vanish. */
    it(`${name} no longer hides the line when program is null`, () => {
      expect(src).not.toContain("{lead.program && (");
    });

    it(`${name} falls back to the school name`, () => {
      expect(src).toMatch(
        /lead\.program \? programLabel\(lead\.program\) : \(lead\.schools\?\.name \?\? "—"\)/
      );
    });
  }
});

describe("the fallback has something to fall back to", () => {
  it("the lead query fetches the school name", () => {
    expect(queries).toContain('select("*, schools(name)")');
  });

  it("the lead type carries it", () => {
    expect(queries).toMatch(/schools\?: \{ name: string \} \| null/);
  });
});

describe("program really is null on purpose, not by accident", () => {
  /**
   * If this ever starts writing a program again the fallback becomes dead code
   * rather than wrong — but the reason for the fallback would have changed, and
   * whoever changes it should see this test and know why the line exists.
   */
  it("the public inquiry deliberately writes no program", () => {
    expect(submit).toContain("p_program: null");
  });
});

describe("the label a card shows", () => {
  it("carries the campus inside it, so showing both would repeat", () => {
    expect(programLabel("academy_ga_campus")).toBe("The Academy GA – In-Person");
    expect(programLabel("academy_virtual")).toBe("The Academy Virtual – Full School Program");
  });

  /** Guards the null path the boards now rely on never being reached blindly. */
  it("renders a dash for null rather than an empty string", () => {
    expect(programLabel(null)).toBe("—");
  });
});
