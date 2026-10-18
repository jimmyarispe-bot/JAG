import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  byCampus,
  firstPayableInstalment,
  type FinalizingChild,
  type FinalizingInstalment,
} from "@/lib/admissions/finalizing/load";

function inst(sequence: number, amount: number, isPaid = false): FinalizingInstalment {
  return {
    id: `i${sequence}`,
    sequence,
    label: null,
    dueDate: null,
    amount,
    isPaid,
    paidAt: null,
    paidAmount: null,
    paymentMethod: null,
    paymentReference: null,
  };
}

describe("the first payment that enrolls a child", () => {
  it("skips the months listed at 0.00 before the family starts paying", () => {
    expect(firstPayableInstalment([inst(1, 0), inst(2, 0), inst(3, 850), inst(4, 850)])?.sequence).toBe(3);
  });

  it("goes by sequence, not by the order rows arrive in", () => {
    expect(firstPayableInstalment([inst(4, 850), inst(2, 850), inst(3, 850)])?.sequence).toBe(2);
  });

  it("is nothing when nothing is owed", () => {
    expect(firstPayableInstalment([inst(1, 0)])).toBeNull();
    expect(firstPayableInstalment([])).toBeNull();
  });
});

describe("divided by campus", () => {
  it("groups children under their campus, campuses in name order", () => {
    const child = (schoolName: string, leadId: string) => ({ schoolName, leadId }) as FinalizingChild;
    const grouped = byCampus([child("The Academy GA", "a"), child("The Academy FL", "b"), child("The Academy GA", "c")]);
    expect(grouped.map((g) => g.schoolName)).toEqual(["The Academy FL", "The Academy GA"]);
    expect(grouped[1]!.children.map((c) => c.leadId)).toEqual(["a", "c"]);
  });
});

describe("only Jimmy", () => {
  const root = process.cwd();
  const read = (p: string) => readFileSync(join(root, p), "utf8");

  it("the page refuses anyone who is not the founder", () => {
    const page = read("src/app/dashboard/admissions/finalizing/page.tsx");
    expect(page).toMatch(/if \(!canViewFounderDashboard\(ctx\)\) notFound\(\);/);
  });

  it("every action checks again on the server", () => {
    const actions = read("src/lib/admissions/finalizing/actions.ts");
    const exported = [...actions.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
    expect(exported.length).toBeGreaterThan(3);
    for (const name of exported) {
      const body = actions.slice(actions.indexOf(`export async function ${name}`));
      const next = body.indexOf("export async function", 10);
      const fn = next > 0 ? body.slice(0, next) : body;
      expect(fn, name).toContain("await requireJimmy()");
    }
  });

  it("the sidebar hides Finalizing Contract from everyone else", () => {
    const nav = read("src/lib/dashboard/navigation.ts");
    expect(nav).toMatch(/label: "Finalizing Contract", founderOnly: true/);
    const sidebar = read("src/components/dashboard/Sidebar.tsx");
    expect(sidebar).toContain("!child.founderOnly");
  });

  it("Enrolled Students shows no money", () => {
    const page = read("src/app/dashboard/enrolled-students/page.tsx");
    expect(page).toContain("{ withMoney: false }");
  });
});
