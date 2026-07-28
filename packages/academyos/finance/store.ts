import type {
  FamilyFinancialAccount,
  FinanceBillingConfig,
  FinanceCredit,
  FinanceInvoice,
  FinancePayment,
  PaymentMethodRecord,
  QuickBooksSyncRecord,
  ScholarshipAward,
  TuitionPlan,
  TuitionSchedule,
} from "./types";
import { DEFAULT_BILLING_CONFIG } from "./config";

type FinanceStore = {
  config: Map<string, FinanceBillingConfig>;
  tuitionPlans: Map<string, TuitionPlan>;
  tuitionSchedules: Map<string, TuitionSchedule>;
  familyAccounts: Map<string, FamilyFinancialAccount>;
  paymentMethods: Map<string, PaymentMethodRecord>;
  scholarshipAwards: Map<string, ScholarshipAward>;
  invoices: Map<string, FinanceInvoice>;
  payments: Map<string, FinancePayment>;
  credits: Map<string, FinanceCredit>;
  qbSync: Map<string, QuickBooksSyncRecord>;
};

const g = globalThis as typeof globalThis & {
  __academyOsFinanceStore?: FinanceStore;
};

function empty(): FinanceStore {
  return {
    config: new Map(),
    tuitionPlans: new Map(),
    tuitionSchedules: new Map(),
    familyAccounts: new Map(),
    paymentMethods: new Map(),
    scholarshipAwards: new Map(),
    invoices: new Map(),
    payments: new Map(),
    credits: new Map(),
    qbSync: new Map(),
  };
}

function store(): FinanceStore {
  if (!g.__academyOsFinanceStore) g.__academyOsFinanceStore = empty();
  return g.__academyOsFinanceStore;
}

export function resetFinanceStoreForTests(): void {
  g.__academyOsFinanceStore = empty();
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function getBillingConfig(organizationId: string): FinanceBillingConfig {
  return store().config.get(organizationId) ?? DEFAULT_BILLING_CONFIG;
}

export function setBillingConfig(
  organizationId: string,
  config: FinanceBillingConfig
): FinanceBillingConfig {
  store().config.set(organizationId, config);
  return config;
}

export function upsertTuitionPlan(p: TuitionPlan): TuitionPlan {
  store().tuitionPlans.set(key(p.organizationId, p.id), p);
  return p;
}

export function getTuitionPlan(
  organizationId: string,
  id: string
): TuitionPlan | null {
  return store().tuitionPlans.get(key(organizationId, id)) ?? null;
}

export function listTuitionPlans(
  organizationId: string
): readonly TuitionPlan[] {
  return Object.freeze(
    [...store().tuitionPlans.values()]
      .filter((p) => p.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function upsertTuitionSchedule(s: TuitionSchedule): TuitionSchedule {
  store().tuitionSchedules.set(key(s.organizationId, s.id), s);
  return s;
}

export function listTuitionSchedules(
  organizationId: string,
  familyAccountId?: string
): readonly TuitionSchedule[] {
  return Object.freeze(
    [...store().tuitionSchedules.values()].filter(
      (s) =>
        s.organizationId === organizationId &&
        (familyAccountId == null || s.familyAccountId === familyAccountId)
    )
  );
}

export function upsertFamilyAccount(
  a: FamilyFinancialAccount
): FamilyFinancialAccount {
  store().familyAccounts.set(key(a.organizationId, a.id), a);
  return a;
}

export function getFamilyAccount(
  organizationId: string,
  id: string
): FamilyFinancialAccount | null {
  return store().familyAccounts.get(key(organizationId, id)) ?? null;
}

export function listFamilyAccounts(
  organizationId: string
): readonly FamilyFinancialAccount[] {
  return Object.freeze(
    [...store().familyAccounts.values()]
      .filter((a) => a.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function findFamilyByStudent(
  organizationId: string,
  studentId: string
): FamilyFinancialAccount | null {
  return (
    [...store().familyAccounts.values()].find(
      (a) =>
        a.organizationId === organizationId && a.studentIds.includes(studentId)
    ) ?? null
  );
}

export function findFamilyByParentToken(
  token: string
): FamilyFinancialAccount | null {
  // resolved via SIS student in parent-portal — store helper unused for token
  void token;
  return null;
}

export function upsertPaymentMethod(
  m: PaymentMethodRecord
): PaymentMethodRecord {
  store().paymentMethods.set(key(m.organizationId, m.id), m);
  return m;
}

export function listPaymentMethods(
  organizationId: string,
  familyAccountId?: string
): readonly PaymentMethodRecord[] {
  return Object.freeze(
    [...store().paymentMethods.values()].filter(
      (m) =>
        m.organizationId === organizationId &&
        (familyAccountId == null || m.familyAccountId === familyAccountId)
    )
  );
}

export function upsertScholarshipAward(a: ScholarshipAward): ScholarshipAward {
  store().scholarshipAwards.set(key(a.organizationId, a.id), a);
  return a;
}

export function getScholarshipAward(
  organizationId: string,
  id: string
): ScholarshipAward | null {
  return store().scholarshipAwards.get(key(organizationId, id)) ?? null;
}

export function listScholarshipAwards(
  organizationId: string,
  opts?: { familyAccountId?: string; studentId?: string }
): readonly ScholarshipAward[] {
  return Object.freeze(
    [...store().scholarshipAwards.values()].filter(
      (a) =>
        a.organizationId === organizationId &&
        (opts?.familyAccountId == null ||
          a.familyAccountId === opts.familyAccountId) &&
        (opts?.studentId == null || a.studentId === opts.studentId)
    )
  );
}

export function upsertInvoice(i: FinanceInvoice): FinanceInvoice {
  store().invoices.set(key(i.organizationId, i.id), i);
  return i;
}

export function getInvoice(
  organizationId: string,
  id: string
): FinanceInvoice | null {
  return store().invoices.get(key(organizationId, id)) ?? null;
}

export function listInvoices(
  organizationId: string,
  opts?: { familyAccountId?: string; studentId?: string; status?: string }
): readonly FinanceInvoice[] {
  return Object.freeze(
    [...store().invoices.values()]
      .filter(
        (i) =>
          i.organizationId === organizationId &&
          (opts?.familyAccountId == null ||
            i.familyAccountId === opts.familyAccountId) &&
          (opts?.studentId == null || i.studentId === opts.studentId) &&
          (opts?.status == null || i.status === opts.status)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function upsertPayment(p: FinancePayment): FinancePayment {
  store().payments.set(key(p.organizationId, p.id), p);
  return p;
}

export function listPayments(
  organizationId: string,
  opts?: { familyAccountId?: string; invoiceId?: string }
): readonly FinancePayment[] {
  return Object.freeze(
    [...store().payments.values()]
      .filter(
        (p) =>
          p.organizationId === organizationId &&
          (opts?.familyAccountId == null ||
            p.familyAccountId === opts.familyAccountId) &&
          (opts?.invoiceId == null || p.invoiceId === opts.invoiceId)
      )
      .sort((a, b) => b.paidOn.localeCompare(a.paidOn))
  );
}

export function upsertCredit(c: FinanceCredit): FinanceCredit {
  store().credits.set(key(c.organizationId, c.id), c);
  return c;
}

export function listCredits(
  organizationId: string,
  familyAccountId?: string
): readonly FinanceCredit[] {
  return Object.freeze(
    [...store().credits.values()].filter(
      (c) =>
        c.organizationId === organizationId &&
        (familyAccountId == null || c.familyAccountId === familyAccountId)
    )
  );
}

export function upsertQbSync(r: QuickBooksSyncRecord): QuickBooksSyncRecord {
  store().qbSync.set(key(r.organizationId, r.id), r);
  return r;
}

export function listQbSync(
  organizationId: string
): readonly QuickBooksSyncRecord[] {
  return Object.freeze(
    [...store().qbSync.values()]
      .filter((r) => r.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
