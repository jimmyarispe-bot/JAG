/**
 * P-009 banking / treasury operational store.
 */

import { assertEphemeralStoreAllowed } from "../runtime-guard";

import type {
  BankConnection,
  BankingException,
  BankingNotification,
  BankInstitution,
  BankTransaction,
  CategorizationRule,
  MatchCandidate,
  StatementImportBatch,
  TreasuryApprovalPolicy,
  TreasuryTransferRequest,
} from "./types";

type BankingStore = {
  institutions: Map<string, BankInstitution>;
  connections: Map<string, BankConnection>;
  transactions: Map<string, BankTransaction>;
  statementBatches: Map<string, StatementImportBatch>;
  transferRequests: Map<string, TreasuryTransferRequest>;
  rules: Map<string, CategorizationRule>;
  matches: Map<string, MatchCandidate>;
  exceptions: Map<string, BankingException>;
  notifications: Map<string, BankingNotification>;
  policies: Map<string, TreasuryApprovalPolicy>;
  txnAudit: { transactionId: string; at: string; action: string; by: string }[];
};

const g = globalThis as typeof globalThis & {
  __jagBankingStore?: BankingStore;
};

function empty(): BankingStore {
  return {
    institutions: new Map(),
    connections: new Map(),
    transactions: new Map(),
    statementBatches: new Map(),
    transferRequests: new Map(),
    rules: new Map(),
    matches: new Map(),
    exceptions: new Map(),
    notifications: new Map(),
    policies: new Map(),
    txnAudit: [],
  };
}

function store(): BankingStore {
  assertEphemeralStoreAllowed("banking");
  if (!g.__jagBankingStore) g.__jagBankingStore = empty();
  return g.__jagBankingStore;
}

export function resetBankingStoreForTests(): void {
  g.__jagBankingStore = empty();
}

function byOrg<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter((x) => x.organizationId === organizationId);
}

export function upsertInstitution(i: BankInstitution): BankInstitution {
  store().institutions.set(i.id, i);
  return i;
}
export function listInstitutions(
  organizationId: string
): readonly BankInstitution[] {
  return Object.freeze(byOrg(store().institutions, organizationId));
}
export function getInstitution(id: string): BankInstitution | null {
  return store().institutions.get(id) ?? null;
}

export function upsertConnection(c: BankConnection): BankConnection {
  store().connections.set(c.id, c);
  return c;
}
export function listConnections(
  organizationId: string
): readonly BankConnection[] {
  return Object.freeze(byOrg(store().connections, organizationId));
}
export function getConnection(id: string): BankConnection | null {
  return store().connections.get(id) ?? null;
}

export function upsertTransaction(t: BankTransaction): BankTransaction {
  store().transactions.set(t.id, t);
  return t;
}
export function listTransactions(
  organizationId: string
): readonly BankTransaction[] {
  return Object.freeze(byOrg(store().transactions, organizationId));
}
export function getTransaction(id: string): BankTransaction | null {
  return store().transactions.get(id) ?? null;
}
export function appendTxnAudit(e: {
  transactionId: string;
  at: string;
  action: string;
  by: string;
}): void {
  store().txnAudit.unshift(e);
  if (store().txnAudit.length > 5000) store().txnAudit.length = 5000;
}
export function listTxnAudit(
  transactionId: string
): readonly { transactionId: string; at: string; action: string; by: string }[] {
  return Object.freeze(
    store().txnAudit.filter((a) => a.transactionId === transactionId)
  );
}

export function upsertStatementBatch(
  b: StatementImportBatch
): StatementImportBatch {
  store().statementBatches.set(b.id, b);
  return b;
}
export function listStatementBatches(
  organizationId: string
): readonly StatementImportBatch[] {
  return Object.freeze(byOrg(store().statementBatches, organizationId));
}
export function getStatementBatch(id: string): StatementImportBatch | null {
  return store().statementBatches.get(id) ?? null;
}

export function upsertTransferRequest(
  t: TreasuryTransferRequest
): TreasuryTransferRequest {
  store().transferRequests.set(t.id, t);
  return t;
}
export function listTransferRequests(
  organizationId: string
): readonly TreasuryTransferRequest[] {
  return Object.freeze(byOrg(store().transferRequests, organizationId));
}
export function getTransferRequest(id: string): TreasuryTransferRequest | null {
  return store().transferRequests.get(id) ?? null;
}

export function upsertRule(r: CategorizationRule): CategorizationRule {
  store().rules.set(r.id, r);
  return r;
}
export function listRules(organizationId: string): readonly CategorizationRule[] {
  return Object.freeze(byOrg(store().rules, organizationId));
}

export function upsertMatch(m: MatchCandidate): MatchCandidate {
  store().matches.set(m.id, m);
  return m;
}
export function listMatches(organizationId: string): readonly MatchCandidate[] {
  return Object.freeze(byOrg(store().matches, organizationId));
}

export function upsertException(e: BankingException): BankingException {
  store().exceptions.set(e.id, e);
  return e;
}
export function listExceptions(
  organizationId: string
): readonly BankingException[] {
  return Object.freeze(byOrg(store().exceptions, organizationId));
}

export function upsertNotification(
  n: BankingNotification
): BankingNotification {
  store().notifications.set(n.id, n);
  return n;
}
export function listNotifications(
  organizationId: string
): readonly BankingNotification[] {
  return Object.freeze(byOrg(store().notifications, organizationId));
}

export function upsertPolicy(p: TreasuryApprovalPolicy): TreasuryApprovalPolicy {
  store().policies.set(p.organizationId, p);
  return p;
}
export function getPolicy(
  organizationId: string
): TreasuryApprovalPolicy | null {
  return store().policies.get(organizationId) ?? null;
}
