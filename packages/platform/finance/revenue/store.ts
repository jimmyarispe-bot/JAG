import type {
  CollectionActivity,
  FundingSource,
  PaymentPlan,
  RecognitionEntry,
  ReminderRule,
  RevenueContract,
  RevenueInvoiceMeta,
  Subscription,
} from "./types";

type RevenueStore = {
  funding: Map<string, FundingSource>;
  contracts: Map<string, RevenueContract>;
  subscriptions: Map<string, Subscription>;
  invoiceMeta: Map<string, RevenueInvoiceMeta>;
  recognition: Map<string, RecognitionEntry>;
  collections: Map<string, CollectionActivity>;
  plans: Map<string, PaymentPlan>;
  reminders: Map<string, ReminderRule>;
};

const g = globalThis as typeof globalThis & {
  __jagRevenueStore?: RevenueStore;
};

function empty(): RevenueStore {
  return {
    funding: new Map(),
    contracts: new Map(),
    subscriptions: new Map(),
    invoiceMeta: new Map(),
    recognition: new Map(),
    collections: new Map(),
    plans: new Map(),
    reminders: new Map(),
  };
}

function store(): RevenueStore {
  if (!g.__jagRevenueStore) g.__jagRevenueStore = empty();
  return g.__jagRevenueStore;
}

export function resetRevenueStoreForTests(): void {
  g.__jagRevenueStore = empty();
}

function byOrg<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter((x) => x.organizationId === organizationId);
}

export function upsertFunding(f: FundingSource): FundingSource {
  store().funding.set(f.id, f);
  return f;
}
export function listFunding(organizationId: string): readonly FundingSource[] {
  return Object.freeze(byOrg(store().funding, organizationId));
}
export function getFunding(id: string): FundingSource | null {
  return store().funding.get(id) ?? null;
}

export function upsertContract(c: RevenueContract): RevenueContract {
  store().contracts.set(c.id, c);
  return c;
}
export function listContracts(organizationId: string): readonly RevenueContract[] {
  return Object.freeze(byOrg(store().contracts, organizationId));
}
export function getContract(id: string): RevenueContract | null {
  return store().contracts.get(id) ?? null;
}

export function upsertSubscription(s: Subscription): Subscription {
  store().subscriptions.set(s.id, s);
  return s;
}
export function listSubscriptions(
  organizationId: string
): readonly Subscription[] {
  return Object.freeze(byOrg(store().subscriptions, organizationId));
}

export function upsertInvoiceMeta(m: RevenueInvoiceMeta): RevenueInvoiceMeta {
  store().invoiceMeta.set(m.invoiceId, m);
  return m;
}
export function getInvoiceMeta(invoiceId: string): RevenueInvoiceMeta | null {
  return store().invoiceMeta.get(invoiceId) ?? null;
}
export function listInvoiceMeta(
  organizationId: string
): readonly RevenueInvoiceMeta[] {
  return Object.freeze(byOrg(store().invoiceMeta, organizationId));
}

export function upsertRecognition(r: RecognitionEntry): RecognitionEntry {
  store().recognition.set(r.id, r);
  return r;
}
export function listRecognition(
  organizationId: string
): readonly RecognitionEntry[] {
  return Object.freeze(byOrg(store().recognition, organizationId));
}

export function upsertCollection(c: CollectionActivity): CollectionActivity {
  store().collections.set(c.id, c);
  return c;
}
export function listCollections(
  organizationId: string
): readonly CollectionActivity[] {
  return Object.freeze(byOrg(store().collections, organizationId));
}

export function upsertPlan(p: PaymentPlan): PaymentPlan {
  store().plans.set(p.id, p);
  return p;
}
export function listPlans(organizationId: string): readonly PaymentPlan[] {
  return Object.freeze(byOrg(store().plans, organizationId));
}

export function upsertReminder(r: ReminderRule): ReminderRule {
  store().reminders.set(r.id, r);
  return r;
}
export function listReminders(organizationId: string): readonly ReminderRule[] {
  return Object.freeze(byOrg(store().reminders, organizationId));
}
