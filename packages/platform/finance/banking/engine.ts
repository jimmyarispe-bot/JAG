/**
 * TreasuryEngine — operational banking & treasury orchestrator (P-009).
 *
 * Not AI CFO. Not forecasting. Not reconciliation. Not EBITDA.
 */

import {
  createTreasuryBankAccount,
  listTreasuryAccounts,
  TREASURY_ACCOUNT_KINDS,
  updateBankAccountBalances,
} from "./accounts";
import {
  connectInstitution,
  describeConnectionProviders,
  listConnections,
  markConnectionStatus,
  rotateConnectionCredentials,
} from "./connections";
import { exportBankingSnapshot } from "./exports";
import { registerInstitution, listInstitutions } from "./institutions";
import {
  OCR_HOOK,
  SUPPORTED_IMPORT_FORMATS,
  commitStatementImport,
  listStatementBatches,
  previewStatementImport,
  rollbackStatementImport,
  validateStatementImport,
} from "./imports";
import {
  acceptMatch,
  listMatches,
  matchingCapabilities,
  rejectMatch,
  suggestMatch,
} from "./matching";
import {
  closeException,
  listExceptions,
  raiseBankingException,
} from "./exceptions";
import {
  listNotifications,
  markNotificationRead,
  notifyBanking,
} from "./notifications";
import { paymentRails, registerReturnedPayment } from "./payments";
import {
  applyRulesToTransaction,
  createCategorizationRule,
  detectRecurringPattern,
  listRules,
} from "./rules";
import {
  getTreasuryApprovalPolicy,
  maskAccountNumber,
  setTreasuryApprovalPolicy,
} from "./security";
import {
  correctTransaction,
  createBankTransaction,
  linkTransaction,
  listTransactions,
  setTransactionStatus,
  splitTransaction,
  transactionHistory,
  voidTransaction,
} from "./transactions";
import {
  approveTreasuryTransfer,
  cashPosition,
  describePaymentRails,
  executeTreasuryTransfer,
  listTransferRequests,
  planCashConcentration,
  requestTreasuryTransfer,
} from "./treasury";
import { TREASURY_GUARDS } from "./types";
import {
  createBankAccount,
  describePlaidInterface,
  importBankStatement,
  listBanks,
  listImports,
} from "./facade";

export class TreasuryEngine {
  readonly guards = TREASURY_GUARDS;
  readonly accountKinds = TREASURY_ACCOUNT_KINDS;
  readonly importFormats = SUPPORTED_IMPORT_FORMATS;
  readonly ocrHook = OCR_HOOK;

  // P-008 facade (compat)
  createBankAccount = createBankAccount;
  importBankStatement = importBankStatement;
  listBankAccounts = listBanks;
  listBankImports = listImports;
  plaidInterface = describePlaidInterface;

  // Institutions / connections
  registerInstitution = registerInstitution;
  listInstitutions = listInstitutions;
  connectInstitution = connectInstitution;
  listConnections = listConnections;
  markConnectionStatus = markConnectionStatus;
  rotateConnectionCredentials = rotateConnectionCredentials;
  connectionProviders = describeConnectionProviders;

  // Accounts
  createTreasuryAccount = createTreasuryBankAccount;
  updateBalances = updateBankAccountBalances;
  listTreasuryAccounts = listTreasuryAccounts;

  // Transactions
  createTransaction = createBankTransaction;
  setTransactionStatus = setTransactionStatus;
  voidTransaction = voidTransaction;
  correctTransaction = correctTransaction;
  splitTransaction = splitTransaction;
  linkTransaction = linkTransaction;
  listTransactions = listTransactions;
  transactionHistory = transactionHistory;

  // Statements / imports
  previewImport = previewStatementImport;
  validateImport = validateStatementImport;
  commitImport = commitStatementImport;
  rollbackImport = rollbackStatementImport;
  listStatementBatches = listStatementBatches;

  // Treasury transfers / cash
  requestTransfer = requestTreasuryTransfer;
  approveTransfer = approveTreasuryTransfer;
  executeTransfer = executeTreasuryTransfer;
  listTransferRequests = listTransferRequests;
  cashPosition = cashPosition;
  planCashConcentration = planCashConcentration;
  paymentRails = paymentRails;
  describePaymentRails = describePaymentRails;
  registerReturnedPayment = registerReturnedPayment;

  // Rules / matching / exceptions
  createRule = createCategorizationRule;
  listRules = listRules;
  applyRules = applyRulesToTransaction;
  detectRecurring = detectRecurringPattern;
  suggestMatch = suggestMatch;
  acceptMatch = acceptMatch;
  rejectMatch = rejectMatch;
  listMatches = listMatches;
  matchingCapabilities = matchingCapabilities;
  raiseException = raiseBankingException;
  closeException = closeException;
  listExceptions = listExceptions;

  // Security / notifications / exports
  setApprovalPolicy = setTreasuryApprovalPolicy;
  getApprovalPolicy = getTreasuryApprovalPolicy;
  maskAccount = maskAccountNumber;
  notify = notifyBanking;
  listNotifications = listNotifications;
  markNotificationRead = markNotificationRead;
  exportSnapshot = exportBankingSnapshot;

  bootstrapTreasury(input: {
    organizationId: string;
    userId: string;
    institutionName?: string;
  }) {
    const institution = this.registerInstitution({
      organizationId: input.organizationId,
      userId: input.userId,
      name: input.institutionName ?? "Sandbox Bank",
      provider: "sandbox",
    });
    if ("error" in institution) return institution;

    const connection = this.connectInstitution({
      organizationId: input.organizationId,
      userId: input.userId,
      institutionId: institution.id,
    });
    if ("error" in connection) return connection;

    const operating = this.createTreasuryAccount({
      organizationId: input.organizationId,
      userId: input.userId,
      name: "Operating Checking",
      kind: "checking",
      connectionId: connection.id,
      institutionId: institution.id,
      currentBalance: 100_000,
      availableBalance: 95_000,
      mask: "4321",
    });
    if ("error" in operating) return operating;

    const restricted = this.createTreasuryAccount({
      organizationId: input.organizationId,
      userId: input.userId,
      name: "Restricted Grants",
      kind: "restricted_cash",
      institutionId: institution.id,
      currentBalance: 25_000,
      availableBalance: 0,
      restricted: true,
      mask: "9988",
    });
    if ("error" in restricted) return restricted;

    return {
      institution,
      connection,
      operating,
      restricted,
      cash: this.cashPosition(input.organizationId),
      guards: this.guards,
      providers: this.connectionProviders(),
      matching: this.matchingCapabilities(),
    };
  }
}

export function createTreasuryEngine(): TreasuryEngine {
  return new TreasuryEngine();
}
