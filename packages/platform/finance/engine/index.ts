/**
 * FinanceEngine — canonical JAG Finance™ foundation orchestrator (P-008).
 */

import { listFinanceAudit } from "../audit";
import { attachFinanceDocument, listAttachments } from "../attachments";
import {
  createBankAccount,
  describePlaidInterface,
  importBankStatement,
  listBanks,
  listImports,
} from "../banking";
import { createBudget, listBudgets } from "../budgets";
import {
  createAccount,
  listAccounts,
  listCoaTemplates,
  seedChartOfAccounts,
  setAccountActive,
} from "../chart-of-accounts";
import { FINANCE_FOUNDATION_GUARDS } from "../core";
import { listCurrencies } from "../currencies";
import { createFinanceCustomer, listCustomers } from "../customers";
import {
  createFinanceEntity,
  getEntity,
  linkIntercompany,
  listEntities,
  listLinks,
} from "../entities";
import {
  approveJournal,
  createJournalEntry,
  lockPeriod,
  listJournals,
  postJournal,
  reverseJournal,
} from "../journal";
import {
  approveBill,
  createBill,
  listBills,
  payablesAging,
  payBill,
} from "../payables";
import {
  grantFinanceRoles,
  hasFinancePermission,
  requireFinancePermission,
} from "../permissions";
import {
  createInvoice,
  listInvoices,
  receivablesAging,
  receivePayment,
  sendInvoice,
} from "../receivables";
import { buildFinanceDashboard, trialBalanceHint } from "../reporting";
import { list1099Vendors, TAX_FOUNDATION_NOTE } from "../tax";
import { cashBalances, listTransfers, transferCash } from "../treasury";
import { createVendor, listVendors } from "../vendors";
import { listPayments } from "../store";
import {
  createTreasuryEngine,
  TREASURY_GUARDS,
  type TreasuryEngine,
} from "../banking";
import {
  createReconciliationEngine,
  RECONCILIATION_GUARDS,
  type ReconciliationEngine,
} from "../reconciliation";
import {
  createPayablesEngine,
  PAYABLES_GUARDS,
  type PayablesEngine,
} from "../payables";
import {
  createRevenueEngine,
  REVENUE_GUARDS,
  type RevenueEngine,
} from "../revenue";

export class FinanceEngine {
  readonly guards = FINANCE_FOUNDATION_GUARDS;
  readonly treasuryGuards = TREASURY_GUARDS;
  readonly reconciliationGuards = RECONCILIATION_GUARDS;
  readonly payablesGuards = PAYABLES_GUARDS;
  readonly revenueGuards = REVENUE_GUARDS;
  readonly treasury: TreasuryEngine = createTreasuryEngine();
  readonly reconciliation: ReconciliationEngine = createReconciliationEngine();
  readonly payablesOps: PayablesEngine = createPayablesEngine();
  readonly revenue: RevenueEngine = createRevenueEngine();

  // Permissions
  grantRoles = grantFinanceRoles;
  hasPermission = hasFinancePermission;
  requirePermission = requireFinancePermission;

  // Multi-entity
  createEntity = createFinanceEntity;
  linkIntercompany = linkIntercompany;
  listEntities = listEntities;
  getEntity = getEntity;
  listIntercompanyLinks = listLinks;

  // COA
  listCoaTemplates = listCoaTemplates;
  seedChartOfAccounts = seedChartOfAccounts;
  createAccount = createAccount;
  setAccountActive = setAccountActive;
  listAccounts = listAccounts;

  // Ledger / journals
  createJournal = createJournalEntry;
  approveJournal = approveJournal;
  postJournal = postJournal;
  reverseJournal = reverseJournal;
  lockPeriod = lockPeriod;
  listJournals = listJournals;

  // Banking
  createBankAccount = createBankAccount;
  importBankStatement = importBankStatement;
  listBankAccounts = listBanks;
  listBankImports = listImports;
  plaidInterface = describePlaidInterface;

  // Parties
  createVendor = createVendor;
  listVendors = listVendors;
  createCustomer = createFinanceCustomer;
  listCustomers = listCustomers;

  // AP / AR
  createBill = createBill;
  approveBill = approveBill;
  payBill = payBill;
  payablesAging = payablesAging;
  listBills = listBills;
  createInvoice = createInvoice;
  sendInvoice = sendInvoice;
  receivePayment = receivePayment;
  receivablesAging = receivablesAging;
  listInvoices = listInvoices;
  listPayments = listPayments;

  // Budgets / treasury
  createBudget = createBudget;
  listBudgets = listBudgets;
  transferCash = transferCash;
  cashBalances = cashBalances;
  listTransfers = listTransfers;

  // Attachments / audit / tax / currencies
  attachDocument = attachFinanceDocument;
  listAttachments = listAttachments;
  listAudit = listFinanceAudit;
  list1099Vendors = list1099Vendors;
  taxNote = TAX_FOUNDATION_NOTE;
  listCurrencies = listCurrencies;

  // Reporting (foundation only)
  dashboard = buildFinanceDashboard;
  trialBalanceHint = trialBalanceHint;

  /** Bootstrap common foundation: roles + parent entity + COA template */
  bootstrap(input: {
    organizationId: string;
    userId: string;
    entityName?: string;
    coaTemplate?: Parameters<typeof seedChartOfAccounts>[0]["templateId"];
  }) {
    this.grantRoles({
      organizationId: input.organizationId,
      userId: input.userId,
      roles: Object.freeze(["cfo", "financial_administrator"]),
      actorUserId: input.userId,
    });
    const entity = this.createEntity({
      organizationId: input.organizationId,
      userId: input.userId,
      name: input.entityName ?? "Primary Entity",
      kind: "single",
    });
    if ("error" in entity) return { error: entity.error };
    const accounts = this.seedChartOfAccounts({
      organizationId: input.organizationId,
      userId: input.userId,
      templateId: input.coaTemplate ?? "corporate",
      entityId: entity.id,
    });
    if ("error" in accounts) return { error: accounts.error };
    return {
      entity,
      accounts,
      dashboard: this.dashboard(input.organizationId),
      guards: this.guards,
    };
  }
}

export function createFinanceEngine(): FinanceEngine {
  return new FinanceEngine();
}
