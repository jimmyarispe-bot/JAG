import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { contractBlocksForSchool } from "@/lib/admissions/contract/for-lead";
import { FL_CONTRACT_BLOCKS } from "@/lib/admissions/contract/fl-2026-09-06";
import { GA_CONTRACT_BLOCKS } from "@/lib/admissions/contract/ga-2026-09-06";
import { HS_CONTRACT_BLOCKS } from "@/lib/admissions/contract/hs-2026-09-06";
import { VIRTUAL_CONTRACT_BLOCKS } from "@/lib/admissions/contract/virtual-2026-09-06";
import {
  renderContractTemplate,
  unfillablePlaceholders,
  type ContractFields,
} from "@/lib/admissions/contract/render";

/**
 * The FL, HS and Virtual contracts (6 September revisions, loaded 18 October),
 * checked against the renderer that serves them - the same checks GA has.
 */

const FIELDS: ContractFields = {
  student_name: "Test Child",
  student_birthdate: null,
  student_grade: "9th Grade",
  school_year: "2026-2027",
  guardian_1_name: "Test Parent",
  guardian_2_name: null,
  school_name: "The Academy FL",
  school_legal_name: "The Academy FL, LLC. dba The Academy",
  school_signatory: "Jimmy Arispe, CEO/Founder of The Academy FL, LLC.",
  annual_tuition: 19950,
  prorated_tuition: 13300,
  proration_label: "8 of 12 months",
  billing_basis: 13300,
  scholarship_total: 8000,
  remaining_due: 5300,
  monthly_amount: null,
  tuition_insurance_cost: 498.75,
  instalments: [
    { label: "Initial payment", dueDate: null, amount: 662.5 },
    { label: "November", dueDate: "2026-11-25", amount: 4637.5 },
  ],
};

const CAMPUSES = {
  FL: FL_CONTRACT_BLOCKS,
  HS: HS_CONTRACT_BLOCKS,
  Virtual: VIRTUAL_CONTRACT_BLOCKS,
} as const;

describe.each(Object.entries(CAMPUSES))("%s contract", (_name, blocks) => {
  it("has the same five parts, with the same keys, as GA", () => {
    expect(blocks.map((b) => b.templateKey)).toEqual(GA_CONTRACT_BLOCKS.map((b) => b.templateKey));
    expect(blocks.map((b) => b.sortOrder)).toEqual([1, 2, 3, 4, 5]);
    expect(blocks.every((b) => b.requiresSignature)).toBe(true);
  });

  it("uses no placeholder the renderer cannot fill", () => {
    for (const b of blocks) expect(unfillablePlaceholders(b.bodyHtml), b.templateKey).toEqual([]);
  });

  it("renders every part, with no braces left anywhere", () => {
    for (const b of blocks) {
      const html = renderContractTemplate(b.bodyHtml, FIELDS, { templateKey: b.templateKey });
      expect(html, b.templateKey).not.toMatch(/\{\{|\}\}/);
    }
  });

  it("states the schedule on its face instead of asking for an upload", () => {
    const first = blocks[0]!.bodyHtml;
    expect(first).toContain("{{schedule_of_payments}}");
    expect(first).toContain("{{tuition_derivation}}");
    for (const b of blocks) expect(b.bodyHtml.toLowerCase()).not.toContain("choose file");
  });

  it("states the late fee and the suspension in the policy's words", () => {
    const first = blocks[0]!.bodyHtml;
    expect(first).toContain("$25 per day");
    expect(first).toContain("five days ($125)");
    expect(first).toMatch(/SUSPENSION OF (ATTENDANCE|ACCESS)/);
  });

  it("takes the school's signatory and legal name from the school record", () => {
    expect(blocks[4]!.bodyHtml).toContain("{{school_signatory}}");
    expect(blocks[0]!.bodyHtml).toContain("{{school_legal_name}}");
    expect(blocks.map((b) => b.bodyHtml).join(" ")).not.toContain("Jimmy Arispe");
  });

  it("offers no election a family cannot answer here", () => {
    const all = blocks.map((b) => b.bodyHtml).join(" ").toLowerCase();
    expect(all).not.toContain("tuition insurance");
    expect(all).not.toContain("tuition lock");
  });
});

describe("month to month at HS and Virtual", () => {
  for (const [name, blocks] of [
    ["HS", HS_CONTRACT_BLOCKS],
    ["Virtual", VIRTUAL_CONTRACT_BLOCKS],
  ] as const) {
    const all = blocks.map((b) => b.bodyHtml).join(" ");
    it(`${name} owes the full monthly tuition, never the year`, () => {
      expect(all).toContain("full monthly tuition");
      expect(all).not.toContain("full tuition specified below");
      expect(all).not.toContain("TOTAL and FULL published annual tuition");
      expect(all).toContain("month to month contract");
    });
  }

  it("Virtual says Aug - May, as written; nothing reconciled it with GA", () => {
    expect(VIRTUAL_CONTRACT_BLOCKS[1]!.bodyHtml).toContain("Aug &ndash;\n  May");
  });
});

describe("each campus gets its own contract", () => {
  it("by campus name", () => {
    expect(contractBlocksForSchool("The Academy FL")).toBe(FL_CONTRACT_BLOCKS);
    expect(contractBlocksForSchool("The Academy GA")).toBe(GA_CONTRACT_BLOCKS);
    expect(contractBlocksForSchool(" the academy hs ")).toBe(HS_CONTRACT_BLOCKS);
    expect(contractBlocksForSchool("The Academy Virtual")).toBe(VIRTUAL_CONTRACT_BLOCKS);
    expect(contractBlocksForSchool("XXXXXXXX Test Campus")).toBeNull();
  });
});

describe("the database copy is the module, not a retyping", () => {
  it("migration 570 carries every block body exactly", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/570_the_contracts_for_fl_hs_and_virtual_2026_10_18.sql"),
      "utf8"
    );
    for (const blocks of Object.values(CAMPUSES)) {
      for (const b of blocks) expect(sql).toContain(`$c$${b.bodyHtml}$c$`);
    }
  });
});

describe("parents see only the contract", () => {
  it("the parent areas send a parent-only account to /contract", () => {
    const root = process.cwd();
    expect(readFileSync(join(root, "src/app/portal/layout.tsx"), "utf8")).toContain(
      "if (isParentOnly(sessionUser)) redirect(PARENT_HOME);"
    );
    expect(readFileSync(join(root, "src/app/apply/portal/layout.tsx"), "utf8")).toContain(
      "if (isParentOnly(session)) redirect(PARENT_HOME);"
    );
  });

  it("signing never uses the service role to write the signature", () => {
    const actions = readFileSync(join(process.cwd(), "src/lib/admissions/contract/parent-actions.ts"), "utf8");
    expect(actions).toMatch(/await parent\.from\("enrollment_packet_signatures"\)\.insert/);
    expect(actions).not.toMatch(/admin\.from\("enrollment_packet_signatures"\)/);
  });
});
