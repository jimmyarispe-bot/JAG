/**
 * Chart of accounts templates — industry-agnostic starters.
 */

import type { AccountType, CoaTemplateId } from "../types";

export type CoaSeedAccount = {
  readonly number: string;
  readonly name: string;
  readonly type: AccountType;
};

const BASE_ASSETS: CoaSeedAccount[] = [
  { number: "1000", name: "Cash", type: "asset" },
  { number: "1100", name: "Accounts Receivable", type: "asset" },
  { number: "1200", name: "Inventory", type: "asset" },
  { number: "1500", name: "Fixed Assets", type: "asset" },
];

const BASE_LIAB: CoaSeedAccount[] = [
  { number: "2000", name: "Accounts Payable", type: "liability" },
  { number: "2100", name: "Accrued Liabilities", type: "liability" },
  { number: "2500", name: "Long-term Debt", type: "liability" },
];

const BASE_EQUITY: CoaSeedAccount[] = [
  { number: "3000", name: "Equity / Net Assets", type: "equity" },
  { number: "3900", name: "Retained Earnings / Net Assets", type: "equity" },
];

const BASE_REV: CoaSeedAccount[] = [
  { number: "4000", name: "Operating Revenue", type: "revenue" },
  { number: "4100", name: "Other Income", type: "revenue" },
];

const BASE_EXP: CoaSeedAccount[] = [
  { number: "5000", name: "Cost of Goods / Programs", type: "expense" },
  { number: "6000", name: "Operating Expenses", type: "expense" },
  { number: "6100", name: "Personnel", type: "expense" },
  { number: "7000", name: "Administrative", type: "expense" },
];

function pack(
  extra: CoaSeedAccount[] = []
): readonly CoaSeedAccount[] {
  return Object.freeze([
    ...BASE_ASSETS,
    ...BASE_LIAB,
    ...BASE_EQUITY,
    ...BASE_REV,
    ...BASE_EXP,
    ...extra,
  ]);
}

export function accountsForTemplate(
  template: CoaTemplateId
): readonly CoaSeedAccount[] {
  switch (template) {
    case "nonprofit":
      return pack([
        { number: "4200", name: "Contributions", type: "revenue" },
        { number: "4300", name: "Grants", type: "revenue" },
        { number: "6200", name: "Program Services", type: "expense" },
      ]);
    case "education":
      return pack([
        { number: "4400", name: "Tuition Revenue", type: "revenue" },
        { number: "4500", name: "Auxiliary Revenue", type: "revenue" },
        { number: "6300", name: "Instruction", type: "expense" },
      ]);
    case "healthcare":
      return pack([
        { number: "4600", name: "Patient Service Revenue", type: "revenue" },
        { number: "1150", name: "Allowance for Doubtful Accounts", type: "contra_asset" },
      ]);
    case "government":
      return pack([
        { number: "4700", name: "Tax / Appropriations", type: "revenue" },
        { number: "6400", name: "Public Services", type: "expense" },
      ]);
    case "manufacturing":
      return pack([
        { number: "1300", name: "Raw Materials", type: "asset" },
        { number: "5100", name: "Direct Labor", type: "expense" },
      ]);
    case "professional_services":
      return pack([
        { number: "4800", name: "Professional Fees", type: "revenue" },
        { number: "6500", name: "Contractor Costs", type: "expense" },
      ]);
    case "custom":
      return Object.freeze([
        { number: "1000", name: "Cash", type: "asset" as const },
        { number: "2000", name: "Accounts Payable", type: "liability" as const },
        { number: "3000", name: "Equity", type: "equity" as const },
        { number: "4000", name: "Revenue", type: "revenue" as const },
        { number: "5000", name: "Expenses", type: "expense" as const },
      ]);
    case "corporate":
    default:
      return pack();
  }
}
