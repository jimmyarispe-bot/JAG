import { describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import {
  creditableAwardAmount,
  remainingAwardCredit,
  resolveFundingCreditsForStudent,
} from "@/lib/finance/tuition-engine";

type Row = Record<string, unknown>;

function supabaseWith(opts: {
  scholarships?: Row[];
  awards?: Row[];
  priorLines?: Row[];
}) {
  return createMockSupabase(({ table }) => {
    if (table === "scholarship_applications") return { data: opts.scholarships ?? [], error: null };
    if (table === "ssis_student_funding_records") return { data: opts.awards ?? [], error: null };
    if (table === "invoice_line_items") return { data: opts.priorLines ?? [], error: null };
    return { data: [], error: null };
  });
}

const student = TEST_UUIDS.student;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolve = (sb: any, subtotal: number) =>
  resolveFundingCreditsForStudent(sb, student, subtotal);

describe("creditableAwardAmount", () => {
  it("credits a paid award in full", () => {
    expect(creditableAwardAmount({ award_amount: 7500, payment_status: "paid" })).toBe(7500);
  });

  it("credits an expected award in full", () => {
    expect(creditableAwardAmount({ award_amount: 7500, payment_status: "expected" })).toBe(7500);
  });

  it("does NOT credit an award with unknown payment status", () => {
    // The default for state-funding records. Crediting it under-bills the family.
    expect(creditableAwardAmount({ award_amount: 7500, payment_status: "unknown" })).toBe(0);
  });

  it("does NOT credit an overdue award", () => {
    expect(creditableAwardAmount({ award_amount: 7500, payment_status: "overdue" })).toBe(0);
  });

  it("halves a partial award", () => {
    expect(creditableAwardAmount({ award_amount: 1000, payment_status: "partial" })).toBe(500);
  });

  it("ignores missing, zero and negative amounts", () => {
    expect(creditableAwardAmount({ award_amount: null, payment_status: "paid" })).toBe(0);
    expect(creditableAwardAmount({ award_amount: 0, payment_status: "paid" })).toBe(0);
    expect(creditableAwardAmount({ award_amount: -500, payment_status: "paid" })).toBe(0);
  });

  it("is case and whitespace tolerant", () => {
    expect(creditableAwardAmount({ award_amount: 100, payment_status: "  PAID " })).toBe(100);
  });
});

describe("remainingAwardCredit", () => {
  it("subtracts what has already been applied", () => {
    expect(remainingAwardCredit(7500, 2000)).toBe(5500);
  });
  it("never goes negative", () => {
    expect(remainingAwardCredit(7500, 9000)).toBe(0);
  });
  it("treats negative applied as zero", () => {
    expect(remainingAwardCredit(1000, -50)).toBe(1000);
  });
});

describe("resolveFundingCreditsForStudent", () => {
  it("credits nothing when the only award is unpaid/unknown", async () => {
    const sb = supabaseWith({
      awards: [{ award_amount: 7500, payment_status: "unknown", verification_status: "verified" }],
    });
    const { stateFundingCredit } = await resolve(sb, 1000);
    expect(stateFundingCredit).toBe(0);
  });

  it("consumes an annual award across monthly invoices instead of re-granting it", async () => {
    // $7,500 award, $1,000/month. After 7 months, $500 should remain — not $1,000.
    const priorLines = Array.from({ length: 7 }, () => ({
      amount: -1000,
      invoices: { invoice_status: "paid" },
    }));
    const sb = supabaseWith({
      awards: [{ award_amount: 7500, payment_status: "paid", verification_status: "verified" }],
      priorLines,
    });
    const { stateFundingCredit } = await resolve(sb, 1000);
    expect(stateFundingCredit).toBe(500);
  });

  it("grants nothing once the award is fully consumed", async () => {
    const priorLines = Array.from({ length: 8 }, () => ({
      amount: -1000,
      invoices: { invoice_status: "paid" },
    }));
    const sb = supabaseWith({
      awards: [{ award_amount: 7500, payment_status: "paid", verification_status: "verified" }],
      priorLines,
    });
    const { stateFundingCredit } = await resolve(sb, 1000);
    expect(stateFundingCredit).toBe(0);
  });

  it("does not count credits from voided invoices as consumed", async () => {
    const sb = supabaseWith({
      awards: [{ award_amount: 1000, payment_status: "paid", verification_status: "verified" }],
      priorLines: [
        { amount: -400, invoices: { invoice_status: "void" } },
        { amount: -100, invoices: { invoice_status: "paid" } },
      ],
    });
    const { stateFundingCredit } = await resolve(sb, 5000);
    expect(stateFundingCredit).toBe(900);
  });

  it("never credits more than the invoice subtotal", async () => {
    const sb = supabaseWith({
      awards: [{ award_amount: 7500, payment_status: "paid", verification_status: "verified" }],
    });
    const { stateFundingCredit } = await resolve(sb, 900);
    expect(stateFundingCredit).toBe(900);
  });

  it("applies scholarship first, then state funding, without exceeding the subtotal", async () => {
    const sb = supabaseWith({
      scholarships: [{ approved_amount: 300, remaining_award_balance: 300, scholarship_status: "approved" }],
      awards: [{ award_amount: 5000, payment_status: "paid", verification_status: "verified" }],
    });
    const { scholarshipCredit, stateFundingCredit } = await resolve(sb, 1000);
    expect(scholarshipCredit).toBe(300);
    expect(stateFundingCredit).toBe(700);
    expect(scholarshipCredit + stateFundingCredit).toBe(1000);
  });

  it("consumes scholarships across invoices too", async () => {
    const sb = supabaseWith({
      scholarships: [{ approved_amount: 1000, remaining_award_balance: 1000, scholarship_status: "approved" }],
      priorLines: [{ amount: -750, invoices: { invoice_status: "paid" } }],
    });
    const { scholarshipCredit } = await resolve(sb, 1000);
    expect(scholarshipCredit).toBe(250);
  });

  it("returns zero credits for a student with no awards", async () => {
    const { scholarshipCredit, stateFundingCredit } = await resolve(supabaseWith({}), 1000);
    expect(scholarshipCredit).toBe(0);
    expect(stateFundingCredit).toBe(0);
  });
});
