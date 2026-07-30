import { buildFinancialOperationsSummary } from "./dashboard";
import { createFamilyAccountsService } from "./family-accounts";
import {
  listInvoices,
  listPayments,
  listScholarshipAwards,
} from "./store";

export type FinanceReportKind =
  | "ar_aging"
  | "tuition_revenue"
  | "payments_received"
  | "outstanding_balances"
  | "scholarship_funding"
  | "family_statements"
  | "revenue_by_campus"
  | "revenue_by_program"
  | "collections"
  | "payment_trends";

export type FinanceReport = {
  readonly kind: FinanceReportKind;
  readonly organizationId: string;
  readonly generatedAt: string;
  readonly rows: readonly Record<string, string | number>[];
  readonly csv: string;
  readonly pdf: string;
};

function toCsv(rows: readonly Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}

function toPdf(title: string, lines: readonly string[]): string {
  const contentLines = [title, "", ...lines].map((l) =>
    l.replace(/[()\\]/g, "")
  );
  const stream =
    "BT /F1 10 Tf 50 750 Td " +
    contentLines
      .map((l, i) => (i === 0 ? `(${l}) Tj` : `0 -14 Td (${l}) Tj`))
      .join(" ") +
    " ET";
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return pdf;
}

export function createFinanceReportingService() {
  return {
    generate(organizationId: string, kind: FinanceReportKind): FinanceReport {
      const generatedAt = new Date().toISOString();
      const summary = buildFinancialOperationsSummary(organizationId);
      const invoices = listInvoices(organizationId);
      const payments = listPayments(organizationId);
      let rows: Record<string, string | number>[] = [];
      let title: string = kind;

      switch (kind) {
        case "ar_aging":
          title = "Accounts Receivable Aging";
          rows = [
            { bucket: "Current", amount: summary.aging.current },
            { bucket: "1-30", amount: summary.aging.days1to30 },
            { bucket: "31-60", amount: summary.aging.days31to60 },
            { bucket: "61-90", amount: summary.aging.days61to90 },
            { bucket: "90+", amount: summary.aging.days90Plus },
          ];
          break;
        case "tuition_revenue":
          title = "Tuition Revenue";
          rows = invoices
            .filter((i) => i.category === "Tuition")
            .map((i) => ({
              invoice: i.invoiceNumber,
              total: i.totalAmount,
              paid: i.amountPaid,
              balance: i.balanceDue,
              status: i.status,
            }));
          break;
        case "payments_received":
          title = "Payments Received";
          rows = payments
            .filter((p) => p.status === "Completed")
            .map((p) => ({
              date: p.paidOn,
              amount: p.amount,
              method: p.method,
              reference: p.reference ?? "",
            }));
          break;
        case "outstanding_balances":
          title = "Outstanding Balances";
          rows = invoices
            .filter((i) => i.balanceDue > 0)
            .map((i) => ({
              invoice: i.invoiceNumber,
              familyAccountId: i.familyAccountId,
              balance: i.balanceDue,
              dueOn: i.dueOn,
              status: i.status,
            }));
          break;
        case "scholarship_funding":
          title = "Scholarship Funding";
          rows = listScholarshipAwards(organizationId).map((s) => ({
            source: s.fundingSource,
            awarded: s.awardAmount,
            remaining: s.remainingBalance,
            status: s.status,
          }));
          break;
        case "family_statements": {
          title = "Family Statements";
          const accounts = createFamilyAccountsService();
          rows = accounts.list(organizationId).map((a) => {
            const snap = accounts.snapshot(organizationId, a.id)!;
            return {
              account: a.accountNumber,
              name: a.displayName,
              outstanding: snap.outstandingBalance,
              credits: a.creditBalance,
              autopay: a.autoPayEnabled ? "yes" : "no",
            };
          });
          break;
        }
        case "revenue_by_campus":
          title = "Revenue by Campus";
          rows = Object.entries(summary.revenueByCampus).map(
            ([campus, amount]) => ({ campus, amount })
          );
          break;
        case "revenue_by_program":
          title = "Revenue by Program";
          rows = Object.entries(summary.revenueByProgram).map(
            ([program, amount]) => ({ program, amount })
          );
          break;
        case "collections":
          title = "Collections";
          rows = [
            {
              accountsReceivable: summary.accountsReceivable,
              collections: summary.collections,
              paymentRate: summary.paymentRate,
            },
          ];
          break;
        case "payment_trends": {
          title = "Payment Trends";
          const byMonth = new Map<string, number>();
          for (const p of payments.filter((x) => x.status === "Completed")) {
            const m = p.paidOn.slice(0, 7);
            byMonth.set(m, (byMonth.get(m) ?? 0) + p.amount);
          }
          rows = [...byMonth.entries()].map(([month, amount]) => ({
            month,
            amount: Math.round(amount * 100) / 100,
          }));
          break;
        }
      }

      const lines = rows.slice(0, 40).map((r) =>
        Object.entries(r)
          .map(([k, v]) => `${k}=${v}`)
          .join(" | ")
      );
      return {
        kind,
        organizationId,
        generatedAt,
        rows: Object.freeze(rows),
        csv: toCsv(rows),
        pdf: toPdf(title, lines),
      };
    },
  };
}
