/**
 * JAG Treasury™ & Banking — operational money movement (P-009).
 */

export { TREASURY_GUARDS } from "./types";
export type {
  BankConnection,
  BankInstitution,
  BankTransaction,
  BankingException,
  BankingNotification,
  CashPosition,
  CategorizationRule,
  ConnectionProvider,
  MatchCandidate,
  StatementImportBatch,
  TreasuryTransferRequest,
} from "./types";

export { resetBankingStoreForTests } from "./store";
export { TreasuryEngine, createTreasuryEngine } from "./engine";

export {
  createBankAccount,
  describePlaidInterface,
  importBankStatement,
  listBanks,
  listImports,
} from "./facade";

export { TREASURY_ACCOUNT_KINDS } from "./accounts";
export { cashPosition, planCashConcentration } from "./cash";
