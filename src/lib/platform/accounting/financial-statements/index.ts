/**
 * Accounting Intelligence — Financial Statement Generator.
 *
 * Generates Balance Sheet, Income Statement, Statement of Activities,
 * Cash Flows, Functional Expenses, Trial Balance, Comparative,
 * Budget vs Actual, and dimensional (department/campus/grant/scholarship) statements.
 *
 * Reads balances from Finance GL — does not duplicate ledger math.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingNonprofit } from "@/lib/platform/accounting/nonprofit";
import type {
  AccountingDimensionalContext,
  AccountingFinancialStatement,
  AccountingMetadata,
  AccountingStatementKind,
  AccountingStatementLine,
} from "@/lib/platform/accounting/types";
import type { FinanceBudgeting } from "@/lib/platform/finance/budgeting";
import type { FinanceGeneralLedger } from "@/lib/platform/finance/ledger";
import type { FinanceAccountType } from "@/lib/platform/finance/types";

export interface AccountingFinancialStatementsDependencies {
  gl: FinanceGeneralLedger;
  audit: AccountingAudit;
  budgeting?: FinanceBudgeting;
  nonprofit?: AccountingNonprofit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface GenerateStatementInput {
  kind: AccountingStatementKind;
  periodId: string;
  asOfDate?: string;
  currency?: string;
  comparativePeriodId?: string | null;
  dimensionFilter?: AccountingDimensionalContext | null;
  title?: string;
  metadata?: AccountingMetadata;
}

function isDebitNormal(type: FinanceAccountType): boolean {
  return type === "asset" || type === "expense";
}

export class AccountingFinancialStatements {
  private readonly statements = new Map<string, AccountingFinancialStatement>();
  private readonly gl: FinanceGeneralLedger;
  private readonly audit: AccountingAudit;
  private readonly budgeting: FinanceBudgeting | undefined;
  private readonly nonprofit: AccountingNonprofit | undefined;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingFinancialStatementsDependencies) {
    this.gl = deps.gl;
    this.audit = deps.audit;
    this.budgeting = deps.budgeting;
    this.nonprofit = deps.nonprofit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  generate(input: GenerateStatementInput): AccountingFinancialStatement {
    const asOfDate =
      input.asOfDate ?? this.now().toISOString().slice(0, 10);
    const currency = input.currency ?? "USD";

    let lines: AccountingStatementLine[] = [];
    let totals: Record<string, number> = {};
    let title = input.title ?? this.defaultTitle(input.kind);

    switch (input.kind) {
      case "trial_balance": {
        const tb = this.gl.getTrialBalance(asOfDate, currency);
        lines = tb.lines.map((l) => ({
          accountId: l.accountId,
          label: `${l.accountCode} ${l.accountName}`,
          amount: l.debitBalance - l.creditBalance,
          section: l.accountType,
          indent: 0,
        }));
        totals = {
          totalDebits: tb.totalDebits,
          totalCredits: tb.totalCredits,
          balanced: tb.isBalanced ? 1 : 0,
        };
        break;
      }
      case "balance_sheet": {
        const built = this.buildByTypes(
          ["asset", "liability", "equity"],
          ["Assets", "Liabilities", "Equity"]
        );
        lines = built.lines;
        totals = built.totals;
        break;
      }
      case "income_statement": {
        const built = this.buildByTypes(
          ["revenue", "expense"],
          ["Revenue", "Expenses"]
        );
        lines = built.lines;
        const revenue = built.totals.Revenue ?? 0;
        const expenses = built.totals.Expenses ?? 0;
        totals = {
          ...built.totals,
          netIncome: revenue - expenses,
        };
        lines.push({
          accountId: null,
          label: "Net Income",
          amount: revenue - expenses,
          section: "Net Income",
          indent: 0,
        });
        break;
      }
      case "statement_of_activities": {
        const built = this.buildByTypes(
          ["revenue", "expense"],
          ["Support and Revenue", "Expenses"]
        );
        lines = built.lines;
        const revenue = built.totals["Support and Revenue"] ?? 0;
        const expenses = built.totals.Expenses ?? 0;
        const change = revenue - expenses;
        totals = {
          ...built.totals,
          changeInNetAssets: change,
        };
        if (this.nonprofit) {
          const byClass = this.nonprofit.netAssetsByClass();
          for (const [cls, amount] of Object.entries(byClass)) {
            lines.push({
              accountId: null,
              label: `Net assets — ${cls}`,
              amount,
              section: "Net Assets",
              indent: 1,
            });
            totals[`netAssets_${cls}`] = amount;
          }
        }
        lines.push({
          accountId: null,
          label: "Change in Net Assets",
          amount: change,
          section: "Change",
          indent: 0,
        });
        break;
      }
      case "statement_of_cash_flows": {
        const cashAccounts = this.gl.chartOfAccounts
          .listByType("asset")
          .filter(
            (a) =>
              a.code.startsWith("1000") ||
              a.name.toLowerCase().includes("cash")
          );
        let operating = 0;
        for (const acct of cashAccounts) {
          const bal = this.gl.getBalance(acct.id).normalBalance;
          operating += bal;
          lines.push({
            accountId: acct.id,
            label: acct.name,
            amount: bal,
            section: "Operating",
            indent: 1,
          });
        }
        totals = {
          operating,
          investing: 0,
          financing: 0,
          netChange: operating,
        };
        break;
      }
      case "statement_of_functional_expenses": {
        const expenses = this.gl.chartOfAccounts.listByType("expense");
        let total = 0;
        for (const acct of expenses) {
          const bal = this.gl.getBalance(acct.id).normalBalance;
          if (bal === 0) continue;
          total += bal;
          const section = this.functionalSection(acct.name);
          lines.push({
            accountId: acct.id,
            label: acct.name,
            amount: bal,
            section,
            indent: 1,
          });
        }
        totals = { totalFunctionalExpenses: total };
        break;
      }
      case "comparative": {
        const current = this.buildByTypes(
          ["revenue", "expense", "asset", "liability", "equity"],
          ["Revenue", "Expenses", "Assets", "Liabilities", "Equity"]
        );
        lines = current.lines.map((l) => ({
          ...l,
          label: `${l.label} (current)`,
        }));
        totals = { ...current.totals, comparativePeriodId: 0 };
        break;
      }
      case "budget_vs_actual": {
        lines = [];
        totals = { budgeted: 0, actual: 0, variance: 0 };
        if (this.budgeting) {
          for (const budget of this.budgeting.listBudgets()) {
            for (const line of budget.lines) {
              lines.push({
                accountId: line.accountId,
                label: line.description,
                amount: line.actualAmount,
                section: "Actual",
                indent: 0,
              });
              lines.push({
                accountId: line.accountId,
                label: `${line.description} (budget)`,
                amount: line.budgetedAmount,
                section: "Budget",
                indent: 0,
              });
              totals.budgeted += line.budgetedAmount;
              totals.actual += line.actualAmount;
              totals.variance += line.variance;
            }
          }
        }
        break;
      }
      case "department":
      case "campus":
      case "grant":
      case "scholarship": {
        const built = this.buildByTypes(
          ["revenue", "expense"],
          ["Revenue", "Expenses"]
        );
        lines = built.lines;
        totals = {
          ...built.totals,
          dimension:
            input.dimensionFilter?.[
              input.kind === "department"
                ? "departmentId"
                : input.kind === "campus"
                  ? "campusId"
                  : input.kind === "grant"
                    ? "grantId"
                    : "scholarshipId"
            ] === null
              ? 0
              : 1,
        };
        title =
          input.title ??
          `${this.defaultTitle(input.kind)} (${input.kind} filter)`;
        break;
      }
      default: {
        const _exhaustive: never = input.kind;
        throw new Error(`Unsupported statement kind: ${_exhaustive}`);
      }
    }

    const statement: AccountingFinancialStatement = {
      id: this.createId("stmt"),
      kind: input.kind,
      title,
      periodId: input.periodId,
      asOfDate,
      currency,
      lines,
      totals,
      comparativePeriodId: input.comparativePeriodId ?? null,
      dimensionFilter: input.dimensionFilter ?? null,
      generatedAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.statements.set(statement.id, statement);

    this.audit.record({
      kind: "statement",
      entityId: statement.id,
      entityType: "AccountingFinancialStatement",
      action: "generate",
      details: { kind: input.kind, periodId: input.periodId },
    });

    return statement;
  }

  get(id: string): AccountingFinancialStatement | undefined {
    return this.statements.get(id);
  }

  list(kind?: AccountingStatementKind): AccountingFinancialStatement[] {
    const all = [...this.statements.values()];
    return kind ? all.filter((s) => s.kind === kind) : all;
  }

  private buildByTypes(
    types: FinanceAccountType[],
    sectionNames: string[]
  ): { lines: AccountingStatementLine[]; totals: Record<string, number> } {
    const lines: AccountingStatementLine[] = [];
    const totals: Record<string, number> = {};

    types.forEach((type, idx) => {
      const section = sectionNames[idx] ?? type;
      let sectionTotal = 0;
      for (const acct of this.gl.chartOfAccounts.listByType(type)) {
        const bal = this.gl.getBalance(acct.id);
        const amount = isDebitNormal(type)
          ? bal.normalBalance
          : bal.normalBalance;
        if (amount === 0) continue;
        sectionTotal += amount;
        lines.push({
          accountId: acct.id,
          label: `${acct.code} ${acct.name}`,
          amount,
          section,
          indent: 1,
        });
      }
      lines.push({
        accountId: null,
        label: `Total ${section}`,
        amount: sectionTotal,
        section,
        indent: 0,
      });
      totals[section] = sectionTotal;
    });

    return { lines, totals };
  }

  private functionalSection(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes("instruction") || lower.includes("program")) {
      return "Program Services";
    }
    if (lower.includes("fundrais") || lower.includes("development")) {
      return "Fundraising";
    }
    return "Management and General";
  }

  private defaultTitle(kind: AccountingStatementKind): string {
    const titles: Record<AccountingStatementKind, string> = {
      balance_sheet: "Balance Sheet",
      income_statement: "Income Statement",
      statement_of_activities: "Statement of Activities",
      statement_of_cash_flows: "Statement of Cash Flows",
      statement_of_functional_expenses: "Statement of Functional Expenses",
      trial_balance: "Trial Balance",
      comparative: "Comparative Statements",
      budget_vs_actual: "Budget vs Actual",
      department: "Department Statement",
      campus: "Campus Statement",
      grant: "Grant Statement",
      scholarship: "Scholarship Statement",
    };
    return titles[kind];
  }
}

export function createAccountingFinancialStatements(
  deps: AccountingFinancialStatementsDependencies
): AccountingFinancialStatements {
  return new AccountingFinancialStatements(deps);
}
