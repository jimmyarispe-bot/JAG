/**
 * In-process JAG Finance store (tests / single-process foundation).
 */

import { resetBankingStoreForTests } from "./banking/store";
import { resetReconciliationStoreForTests } from "./reconciliation/store";
import { resetPayablesStoreForTests } from "./payables/store";
import { resetRevenueStoreForTests } from "./revenue/store";
import { resetFinanceOpsStoreForTests } from "./operations/events";
import type {
  AccountingPeriod,
  BankAccount,
  BankStatementImport,
  Bill,
  Budget,
  FinanceAttachment,
  FinanceAuditEvent,
  FinanceCustomer,
  FinanceEntity,
  FinancePermissionGrant,
  IntercompanyLink,
  Invoice,
  JournalEntry,
  LedgerAccount,
  PaymentRecord,
  TreasuryTransfer,
  Vendor,
} from "./types";

type FinanceStore = {
  entities: Map<string, FinanceEntity>;
  links: Map<string, IntercompanyLink>;
  accounts: Map<string, LedgerAccount>;
  journals: Map<string, JournalEntry>;
  periods: Map<string, AccountingPeriod>;
  banks: Map<string, BankAccount>;
  imports: Map<string, BankStatementImport>;
  vendors: Map<string, Vendor>;
  customers: Map<string, FinanceCustomer>;
  bills: Map<string, Bill>;
  invoices: Map<string, Invoice>;
  payments: Map<string, PaymentRecord>;
  budgets: Map<string, Budget>;
  transfers: Map<string, TreasuryTransfer>;
  attachments: Map<string, FinanceAttachment>;
  audit: FinanceAuditEvent[];
  permissions: Map<string, FinancePermissionGrant>;
};

const g = globalThis as typeof globalThis & {
  __jagFinanceStore?: FinanceStore;
};

function empty(): FinanceStore {
  return {
    entities: new Map(),
    links: new Map(),
    accounts: new Map(),
    journals: new Map(),
    periods: new Map(),
    banks: new Map(),
    imports: new Map(),
    vendors: new Map(),
    customers: new Map(),
    bills: new Map(),
    invoices: new Map(),
    payments: new Map(),
    budgets: new Map(),
    transfers: new Map(),
    attachments: new Map(),
    audit: [],
    permissions: new Map(),
  };
}

function store(): FinanceStore {
  if (!g.__jagFinanceStore) g.__jagFinanceStore = empty();
  return g.__jagFinanceStore;
}

export function resetFinanceStoreForTests(): void {
  g.__jagFinanceStore = empty();
  resetBankingStoreForTests();
  resetReconciliationStoreForTests();
  resetPayablesStoreForTests();
  resetRevenueStoreForTests();
  resetFinanceOpsStoreForTests();
}

function byOrg<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter((x) => x.organizationId === organizationId);
}

export function upsertEntity(e: FinanceEntity): FinanceEntity {
  store().entities.set(e.id, e);
  return e;
}
export function listEntities(organizationId: string): readonly FinanceEntity[] {
  return Object.freeze(byOrg(store().entities, organizationId));
}
export function getEntity(id: string): FinanceEntity | null {
  return store().entities.get(id) ?? null;
}

export function upsertLink(l: IntercompanyLink): IntercompanyLink {
  store().links.set(l.id, l);
  return l;
}
export function listLinks(organizationId: string): readonly IntercompanyLink[] {
  return Object.freeze(byOrg(store().links, organizationId));
}

export function upsertAccount(a: LedgerAccount): LedgerAccount {
  store().accounts.set(a.id, a);
  return a;
}
export function listAccounts(organizationId: string): readonly LedgerAccount[] {
  return Object.freeze(byOrg(store().accounts, organizationId));
}
export function getAccount(id: string): LedgerAccount | null {
  return store().accounts.get(id) ?? null;
}

export function upsertJournal(j: JournalEntry): JournalEntry {
  store().journals.set(j.id, j);
  return j;
}
export function listJournals(organizationId: string): readonly JournalEntry[] {
  return Object.freeze(byOrg(store().journals, organizationId));
}
export function getJournal(id: string): JournalEntry | null {
  return store().journals.get(id) ?? null;
}

export function upsertPeriod(p: AccountingPeriod): AccountingPeriod {
  store().periods.set(`${p.organizationId}::${p.periodKey}`, p);
  return p;
}
export function getPeriod(
  organizationId: string,
  periodKey: string
): AccountingPeriod | null {
  return store().periods.get(`${organizationId}::${periodKey}`) ?? null;
}
export function listPeriods(
  organizationId: string
): readonly AccountingPeriod[] {
  return Object.freeze(
    [...store().periods.values()].filter(
      (p) => p.organizationId === organizationId
    )
  );
}

export function upsertBank(b: BankAccount): BankAccount {
  store().banks.set(b.id, b);
  return b;
}
export function listBanks(organizationId: string): readonly BankAccount[] {
  return Object.freeze(byOrg(store().banks, organizationId));
}

export function upsertImport(i: BankStatementImport): BankStatementImport {
  store().imports.set(i.id, i);
  return i;
}
export function listImports(
  organizationId: string
): readonly BankStatementImport[] {
  return Object.freeze(byOrg(store().imports, organizationId));
}

export function upsertVendor(v: Vendor): Vendor {
  store().vendors.set(v.id, v);
  return v;
}
export function listVendors(organizationId: string): readonly Vendor[] {
  return Object.freeze(byOrg(store().vendors, organizationId));
}

export function upsertCustomer(c: FinanceCustomer): FinanceCustomer {
  store().customers.set(c.id, c);
  return c;
}
export function listCustomers(
  organizationId: string
): readonly FinanceCustomer[] {
  return Object.freeze(byOrg(store().customers, organizationId));
}

export function upsertBill(b: Bill): Bill {
  store().bills.set(b.id, b);
  return b;
}
export function listBills(organizationId: string): readonly Bill[] {
  return Object.freeze(byOrg(store().bills, organizationId));
}

export function upsertInvoice(i: Invoice): Invoice {
  store().invoices.set(i.id, i);
  return i;
}
export function listInvoices(organizationId: string): readonly Invoice[] {
  return Object.freeze(byOrg(store().invoices, organizationId));
}

export function upsertPayment(p: PaymentRecord): PaymentRecord {
  store().payments.set(p.id, p);
  return p;
}
export function listPayments(organizationId: string): readonly PaymentRecord[] {
  return Object.freeze(byOrg(store().payments, organizationId));
}

export function upsertBudget(b: Budget): Budget {
  store().budgets.set(b.id, b);
  return b;
}
export function listBudgets(organizationId: string): readonly Budget[] {
  return Object.freeze(byOrg(store().budgets, organizationId));
}

export function upsertTransfer(t: TreasuryTransfer): TreasuryTransfer {
  store().transfers.set(t.id, t);
  return t;
}
export function listTransfers(
  organizationId: string
): readonly TreasuryTransfer[] {
  return Object.freeze(byOrg(store().transfers, organizationId));
}

export function upsertAttachment(a: FinanceAttachment): FinanceAttachment {
  store().attachments.set(a.id, a);
  return a;
}
export function listAttachments(
  organizationId: string
): readonly FinanceAttachment[] {
  return Object.freeze(byOrg(store().attachments, organizationId));
}

export function appendAudit(e: FinanceAuditEvent): FinanceAuditEvent {
  store().audit.unshift(e);
  if (store().audit.length > 2000) store().audit.length = 2000;
  return e;
}
export function listAudit(
  organizationId: string,
  limit = 100
): readonly FinanceAuditEvent[] {
  return Object.freeze(
    store()
      .audit.filter((a) => a.organizationId === organizationId)
      .slice(0, limit)
  );
}

function permKey(organizationId: string, userId: string): string {
  return `${organizationId}::${userId}`;
}
export function upsertPermission(
  g: FinancePermissionGrant
): FinancePermissionGrant {
  store().permissions.set(permKey(g.organizationId, g.userId), g);
  return g;
}
export function getPermission(
  organizationId: string,
  userId: string
): FinancePermissionGrant | null {
  return store().permissions.get(permKey(organizationId, userId)) ?? null;
}
