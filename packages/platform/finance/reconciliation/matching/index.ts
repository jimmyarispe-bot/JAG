/**
 * Reconciliation matching engine — confidence-scored candidate generation.
 */

import { randomUUID } from "node:crypto";
import { listTransactions } from "../../banking/store";
import { listBills, listInvoices, listJournals, listPayments } from "../../store";
import type { BankTransaction } from "../../banking/types";
import {
  daysBetween,
  descriptionSimilarity,
  extractCheckNumber,
  extractReference,
  getMatchingRules,
} from "../rules";
import type {
  MatchCardinality,
  MatchSuggestion,
  ReconciliationSideType,
} from "../types";

export type MatchableLine = {
  readonly id: string;
  readonly type: ReconciliationSideType;
  readonly amount: number;
  readonly direction: "in" | "out";
  readonly date: string | null;
  readonly description: string;
  readonly externalId: string | null;
  readonly vendorId: string | null;
  readonly customerId: string | null;
};

function signedAmount(line: MatchableLine): number {
  return line.direction === "in" ? line.amount : -line.amount;
}

export function bankTxnToLine(t: BankTransaction): MatchableLine {
  return {
    id: t.id,
    type: "bank_transaction",
    amount: t.amount,
    direction: t.direction,
    date: t.postedAt ?? t.pendingAt ?? t.createdAt,
    description: `${t.description} ${t.merchantName ?? ""}`.trim(),
    externalId: t.externalId,
    vendorId: t.vendorId,
    customerId: t.customerId,
  };
}

export function loadBookLines(organizationId: string): MatchableLine[] {
  const lines: MatchableLine[] = [];
  for (const j of listJournals(organizationId)) {
    if (j.status !== "posted") continue;
    const debit = j.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
    const credit = j.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
    lines.push({
      id: j.id,
      type: "journal_entry",
      amount: Math.max(debit, credit),
      direction: debit >= credit ? "in" : "out",
      date: j.postedAt ?? j.createdAt,
      description: j.description,
      externalId: null,
      vendorId: null,
      customerId: null,
    });
  }
  for (const inv of listInvoices(organizationId)) {
    if (inv.status === "void") continue;
    lines.push({
      id: inv.id,
      type: "invoice",
      amount: inv.amount,
      direction: "in",
      date: inv.dueAt ?? inv.createdAt,
      description: `Invoice ${inv.id}`,
      externalId: inv.id,
      vendorId: null,
      customerId: inv.customerId,
    });
  }
  for (const bill of listBills(organizationId)) {
    if (bill.status === "void") continue;
    lines.push({
      id: bill.id,
      type: "bill",
      amount: bill.amount,
      direction: "out",
      date: bill.dueAt ?? bill.createdAt,
      description: `Bill ${bill.id}`,
      externalId: bill.id,
      vendorId: bill.vendorId,
      customerId: null,
    });
  }
  for (const p of listPayments(organizationId)) {
    lines.push({
      id: p.id,
      type: "payment",
      amount: p.amount,
      direction: p.direction === "in" ? "in" : "out",
      date: p.paidAt,
      description: `Payment ${p.id}`,
      externalId: p.id,
      vendorId: p.vendorId,
      customerId: p.customerId,
    });
  }
  return lines;
}

export function scorePair(
  organizationId: string,
  left: MatchableLine,
  right: MatchableLine
): { confidence: number; reasons: string[] } {
  const rules = getMatchingRules(organizationId);
  const reasons: string[] = [];
  let score = 0;

  if (Math.abs(left.amount - right.amount) < 0.001) {
    score += rules.exactAmountWeight;
    reasons.push("exact_amount");
    if (
      right.type === "payment" ||
      right.type === "bill" ||
      right.type === "invoice" ||
      right.type === "journal_entry"
    ) {
      score += 0.35;
      reasons.push("book_document");
    }
  } else if (
    Math.abs(left.amount - right.amount) / Math.max(left.amount, 1) < 0.02
  ) {
    score += rules.exactAmountWeight * 0.5;
    reasons.push("near_amount");
  }

  // Opposite economic direction expected for bank vs book in many cases;
  // same signed amount also scores (transfer detection).
  const sameSigned =
    Math.abs(signedAmount(left) - signedAmount(right)) < 0.001;
  const opposite =
    Math.abs(signedAmount(left) + signedAmount(right)) < 0.001;
  if (sameSigned || opposite) {
    if (!reasons.includes("exact_amount")) {
      score += rules.exactAmountWeight * 0.25;
      reasons.push(opposite ? "offsetting_amount" : "same_signed_amount");
    } else if (sameSigned) {
      score += 0.1;
      reasons.push("direction_aligned");
    }
  }

  const days = daysBetween(left.date, right.date);
  if (days !== null && days <= rules.dateToleranceDays) {
    score += rules.dateWeight * (1 - days / (rules.dateToleranceDays + 1));
    reasons.push("date_tolerance");
  }

  const sim = descriptionSimilarity(left.description, right.description);
  if (sim > 0) {
    score += rules.descriptionWeight * sim;
    if (sim >= 0.5) reasons.push("description_similarity");
  }

  const lref = extractReference(left.description) ?? left.externalId;
  const rref = extractReference(right.description) ?? right.externalId;
  if (lref && rref && lref === rref) {
    score += rules.referenceWeight;
    reasons.push("reference_number");
  }

  const lchk = extractCheckNumber(left.description);
  const rchk = extractCheckNumber(right.description);
  if (lchk && rchk && lchk === rchk) {
    score += rules.checkNumberWeight;
    reasons.push("check_number");
  }

  if (left.vendorId && right.vendorId && left.vendorId === right.vendorId) {
    score += 0.08;
    reasons.push("vendor");
  }
  if (
    left.customerId &&
    right.customerId &&
    left.customerId === right.customerId
  ) {
    score += 0.08;
    reasons.push("customer");
  }
  if (right.type === "journal_entry") reasons.push("journal_entry");
  if (right.type === "invoice") reasons.push("invoice");
  if (left.type === "bank_transaction" && right.type === "transfer") {
    reasons.push("transfer_detection");
  }

  return { confidence: Math.min(1, score), reasons };
}

export function detectDuplicates(
  lines: readonly MatchableLine[]
): readonly { a: string; b: string }[] {
  const out: { a: string; b: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const a = lines[i]!;
      const b = lines[j]!;
      if (
        a.externalId &&
        b.externalId &&
        a.externalId === b.externalId &&
        Math.abs(a.amount - b.amount) < 0.001
      ) {
        out.push({ a: a.id, b: b.id });
      } else if (
        Math.abs(a.amount - b.amount) < 0.001 &&
        descriptionSimilarity(a.description, b.description) >= 0.9 &&
        (daysBetween(a.date, b.date) ?? 99) <= 1
      ) {
        out.push({ a: a.id, b: b.id });
      }
    }
  }
  return Object.freeze(out);
}

export function detectRecurring(
  lines: readonly MatchableLine[]
): readonly { pattern: string; ids: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const l of lines) {
    const key = `${tokenizeDescription(l.description)
      .slice(0, 3)
      .join(" ")}|${l.amount}`;
    if (!key.startsWith("|")) {
      const arr = groups.get(key) ?? [];
      arr.push(l.id);
      groups.set(key, arr);
    }
  }
  return Object.freeze(
    [...groups.entries()]
      .filter(([, ids]) => ids.length >= 2)
      .map(([pattern, ids]) => Object.freeze({ pattern, ids: [...ids] }))
  );
}

function tokenizeDescription(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/** 1-to-many: one bank txn equals sum of book lines. */
export function findOneToMany(
  organizationId: string,
  bank: MatchableLine,
  books: readonly MatchableLine[],
  used: Set<string>
): MatchSuggestion | null {
  const rules = getMatchingRules(organizationId);
  const candidates = books
    .filter((b) => !used.has(b.id) && b.direction === bank.direction)
    .filter((b) => (daysBetween(bank.date, b.date) ?? 99) <= rules.dateToleranceDays + 2)
    .sort((a, b) => b.amount - a.amount);

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < Math.min(candidates.length, i + 8); j++) {
      const a = candidates[i]!;
      const b = candidates[j]!;
      if (Math.abs(a.amount + b.amount - bank.amount) < 0.01) {
        return {
          id: `rsug:${randomUUID()}`,
          organizationId,
          periodId: "",
          cardinality: "one_to_many",
          confidence: 0.75,
          leftIds: Object.freeze([bank.id]),
          leftType: bank.type,
          rightIds: Object.freeze([a.id, b.id]),
          rightType: a.type,
          reasons: Object.freeze(["exact_amount", "one_to_many", "split"]),
          createdAt: new Date().toISOString(),
        };
      }
    }
  }
  return null;
}

export function generateMatchSuggestions(input: {
  organizationId: string;
  periodId: string;
  bankAccountId: string;
  matchedBankIds: ReadonlySet<string>;
  matchedBookIds: ReadonlySet<string>;
}): {
  suggestions: MatchSuggestion[];
  duplicates: readonly { a: string; b: string }[];
  recurring: readonly { pattern: string; ids: string[] }[];
} {
  const rules = getMatchingRules(input.organizationId);
  const bankLines = listTransactions(input.organizationId)
    .filter(
      (t) =>
        t.bankAccountId === input.bankAccountId &&
        t.status !== "voided" &&
        !input.matchedBankIds.has(t.id)
    )
    .map(bankTxnToLine);

  const bookLines = loadBookLines(input.organizationId).filter(
    (b) => !input.matchedBookIds.has(b.id)
  );

  const suggestions: MatchSuggestion[] = [];
  const usedBank = new Set<string>();
  const usedBook = new Set<string>();

  // Exact / high-confidence 1:1
  for (const bank of bankLines) {
    let best: { line: MatchableLine; confidence: number; reasons: string[] } | null =
      null;
    for (const book of bookLines) {
      if (usedBook.has(book.id)) continue;
      const { confidence, reasons } = scorePair(
        input.organizationId,
        bank,
        book
      );
      if (confidence < rules.suggestThreshold) continue;
      if (!best || confidence > best.confidence) {
        best = { line: book, confidence, reasons };
      }
    }
    if (best) {
      const cardinality: MatchCardinality = "one_to_one";
      suggestions.push({
        id: `rsug:${randomUUID()}`,
        organizationId: input.organizationId,
        periodId: input.periodId,
        cardinality,
        confidence: best.confidence,
        leftIds: Object.freeze([bank.id]),
        leftType: bank.type,
        rightIds: Object.freeze([best.line.id]),
        rightType: best.line.type,
        reasons: Object.freeze([...best.reasons]),
        createdAt: new Date().toISOString(),
      });
      if (best.confidence >= rules.autoAcceptThreshold) {
        usedBank.add(bank.id);
        usedBook.add(best.line.id);
      }
    } else {
      const otm = findOneToMany(
        input.organizationId,
        bank,
        bookLines,
        usedBook
      );
      if (otm) {
        suggestions.push({
          ...otm,
          periodId: input.periodId,
        });
      }
    }
  }

  // Partial: near amount within 5%
  for (const bank of bankLines) {
    if (usedBank.has(bank.id)) continue;
    if (suggestions.some((s) => s.leftIds.includes(bank.id))) continue;
    for (const book of bookLines) {
      if (usedBook.has(book.id)) continue;
      const delta = Math.abs(bank.amount - book.amount);
      if (delta > 0.01 && delta / bank.amount <= 0.05) {
        const { confidence, reasons } = scorePair(
          input.organizationId,
          bank,
          book
        );
        if (confidence >= rules.suggestThreshold * 0.8) {
          suggestions.push({
            id: `rsug:${randomUUID()}`,
            organizationId: input.organizationId,
            periodId: input.periodId,
            cardinality: "partial",
            confidence: Math.min(confidence, 0.7),
            leftIds: Object.freeze([bank.id]),
            leftType: bank.type,
            rightIds: Object.freeze([book.id]),
            rightType: book.type,
            reasons: Object.freeze([...reasons, "partial"]),
            createdAt: new Date().toISOString(),
          });
          break;
        }
      }
    }
  }

  return {
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
    duplicates: detectDuplicates(bankLines),
    recurring: detectRecurring(bankLines),
  };
}

export function matchedIdSets(
  matches: readonly { leftIds: readonly string[]; rightIds: readonly string[]; status: string }[]
): { bank: Set<string>; book: Set<string> } {
  const bank = new Set<string>();
  const book = new Set<string>();
  for (const m of matches) {
    if (m.status === "rejected") continue;
    for (const id of m.leftIds) bank.add(id);
    for (const id of m.rightIds) book.add(id);
  }
  return { bank, book };
}
