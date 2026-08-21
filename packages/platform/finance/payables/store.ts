import { assertEphemeralStoreAllowed } from "../runtime-guard";
import type {
  DebitMemo,
  PaymentRun,
  PaymentScheduleItem,
  PurchaseOrder,
  PurchaseRequest,
  ReceivingRecord,
  VendorCredit,
  VendorStatement,
} from "./types";

type PayablesStore = {
  requests: Map<string, PurchaseRequest>;
  orders: Map<string, PurchaseOrder>;
  receipts: Map<string, ReceivingRecord>;
  credits: Map<string, VendorCredit>;
  schedules: Map<string, PaymentScheduleItem>;
  runs: Map<string, PaymentRun>;
  debitMemos: Map<string, DebitMemo>;
  statements: Map<string, VendorStatement>;
};

const g = globalThis as typeof globalThis & {
  __jagPayablesStore?: PayablesStore;
};

function empty(): PayablesStore {
  return {
    requests: new Map(),
    orders: new Map(),
    receipts: new Map(),
    credits: new Map(),
    schedules: new Map(),
    runs: new Map(),
    debitMemos: new Map(),
    statements: new Map(),
  };
}

function store(): PayablesStore {
  assertEphemeralStoreAllowed("payables");
  if (!g.__jagPayablesStore) g.__jagPayablesStore = empty();
  return g.__jagPayablesStore;
}

export function resetPayablesStoreForTests(): void {
  g.__jagPayablesStore = empty();
}

function byOrg<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter((x) => x.organizationId === organizationId);
}

export function upsertRequest(r: PurchaseRequest): PurchaseRequest {
  store().requests.set(r.id, r);
  return r;
}
export function listRequests(organizationId: string): readonly PurchaseRequest[] {
  return Object.freeze(byOrg(store().requests, organizationId));
}

export function upsertOrder(o: PurchaseOrder): PurchaseOrder {
  store().orders.set(o.id, o);
  return o;
}
export function getOrder(id: string): PurchaseOrder | null {
  return store().orders.get(id) ?? null;
}
export function listOrders(organizationId: string): readonly PurchaseOrder[] {
  return Object.freeze(byOrg(store().orders, organizationId));
}

export function upsertReceipt(r: ReceivingRecord): ReceivingRecord {
  store().receipts.set(r.id, r);
  return r;
}
export function listReceipts(organizationId: string): readonly ReceivingRecord[] {
  return Object.freeze(byOrg(store().receipts, organizationId));
}

export function upsertCredit(c: VendorCredit): VendorCredit {
  store().credits.set(c.id, c);
  return c;
}
export function listCredits(organizationId: string): readonly VendorCredit[] {
  return Object.freeze(byOrg(store().credits, organizationId));
}

export function upsertSchedule(s: PaymentScheduleItem): PaymentScheduleItem {
  store().schedules.set(s.id, s);
  return s;
}
export function listSchedules(
  organizationId: string
): readonly PaymentScheduleItem[] {
  return Object.freeze(byOrg(store().schedules, organizationId));
}

export function upsertRun(r: PaymentRun): PaymentRun {
  store().runs.set(r.id, r);
  return r;
}
export function listRuns(organizationId: string): readonly PaymentRun[] {
  return Object.freeze(byOrg(store().runs, organizationId));
}

export function upsertDebitMemo(d: DebitMemo): DebitMemo {
  store().debitMemos.set(d.id, d);
  return d;
}
export function listDebitMemos(organizationId: string): readonly DebitMemo[] {
  return Object.freeze(byOrg(store().debitMemos, organizationId));
}

export function upsertStatement(s: VendorStatement): VendorStatement {
  store().statements.set(s.id, s);
  return s;
}
export function listStatements(
  organizationId: string
): readonly VendorStatement[] {
  return Object.freeze(byOrg(store().statements, organizationId));
}
