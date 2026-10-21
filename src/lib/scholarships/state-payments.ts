/**
 * WHEN THE STATE PAYS A SCHOLARSHIP, AND HOW MUCH EACH TIME.
 *
 * Jimmy, 20 October 2026: "even for scholarship payment in any state, let's
 * create square invoices for these" - one invoice per state payment.
 *
 * GA Special Needs Scholarship, from the GaDOE letter: payments "on or before
 * October 15, December 15, February 15, and May 15 for quarterly periods
 * corresponding, respectively, to August 1 through September 30, October 1
 * through November 30, December 1 through the last day of February, and March
 * 1 through May 31". A family at 75% gets the last three; 50% the last two.
 *
 * Every other program: its catalog payment_schedule (quarterly or annual) on
 * the same four dates, marked as estimated until its real dates are known.
 *
 * Pure: no database, no clock.
 */

import { GSNS_PROGRAM_CODE, startYearOf } from "./gsns";

export interface StatePayment {
  sequence: number;
  label: string;
  dueDate: string;
  amount: number;
  /** True when the dates are not the program's own published ones. */
  estimated: boolean;
}

const GA_QUARTERS = (y: number) => [
  { dueDate: `${y}-10-15`, label: "Aug 1–Sep 30" },
  { dueDate: `${y}-12-15`, label: "Oct 1–Nov 30" },
  { dueDate: `${y + 1}-02-15`, label: "Dec 1–Feb 28" },
  { dueDate: `${y + 1}-05-15`, label: "Mar 1–May 31" },
];

/** Splits to the cent; the last payment carries any odd cent. */
function split(total: number, parts: number): number[] {
  const cents = Math.round(total * 100);
  const each = Math.floor(cents / parts);
  return Array.from({ length: parts }, (_, i) =>
    (i === parts - 1 ? cents - each * (parts - 1) : each) / 100
  );
}

export function statePaymentSchedule(input: {
  programCode: string | null;
  programName: string;
  awardYear: string;
  awardedAmount: number;
  /** GSNS share, 25/50/75/100. Null for other programs. */
  awardPercent: number | null;
  /** funding_program_catalog.payment_schedule: "quarterly" | "annual" | ... */
  paymentSchedule: string | null;
}): StatePayment[] {
  if (!(input.awardedAmount > 0)) return [];
  const y = startYearOf(input.awardYear);
  if (y === null) return [];
  const quarters = GA_QUARTERS(y);

  if (input.programCode === GSNS_PROGRAM_CODE) {
    const count = input.awardPercent === null ? 4 : Math.max(0, Math.min(4, Math.round(input.awardPercent / 25)));
    if (count === 0) return [];
    const kept = quarters.slice(4 - count);
    const amounts = split(input.awardedAmount, count);
    return kept.map((q, i) => ({
      sequence: i + 1,
      label: `${input.programName} · ${q.label}`,
      dueDate: q.dueDate,
      amount: amounts[i],
      estimated: false,
    }));
  }

  if ((input.paymentSchedule ?? "").toLowerCase() === "quarterly") {
    const amounts = split(input.awardedAmount, 4);
    return quarters.map((q, i) => ({
      sequence: i + 1,
      label: `${input.programName} · payment ${i + 1} of 4`,
      dueDate: q.dueDate,
      amount: amounts[i],
      estimated: true,
    }));
  }

  return [
    {
      sequence: 1,
      label: `${input.programName} · ${input.awardYear}`,
      dueDate: quarters[0].dueDate,
      amount: input.awardedAmount,
      estimated: true,
    },
  ];
}
