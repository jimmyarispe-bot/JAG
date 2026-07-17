/**
 * QuickBooks Online SoR client.
 * Demo store ships production-shaped accounting data for sync/tests/ECC.
 */

import type { QuickBooksAuthSession, QuickBooksCompany } from "./auth";
import type {
  QuickBooksEnvironment,
  QuickBooksObjectType,
  QuickBooksRawEntity,
} from "./entities";
import { QUICKBOOKS_OBJECT_TYPES } from "./entities";

export type QuickBooksListPage = {
  records: QuickBooksRawEntity[];
  nextCursor: string | null;
};

export interface QuickBooksClient {
  authenticate(input: {
    accessToken: string;
    environment?: QuickBooksEnvironment;
    companyId?: string;
  }): Promise<{ ok: boolean; error?: string; session?: QuickBooksAuthSession }>;
  refreshToken(refreshToken: string): Promise<{
    ok: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    error?: string;
  }>;
  listCompanies(accessToken: string): Promise<QuickBooksCompany[]>;
  health(): Promise<{
    ok: boolean;
    latencyMs: number;
    environment: QuickBooksEnvironment;
    rateLimitRemaining: number;
  }>;
  list(
    organizationId: string,
    objectType: QuickBooksObjectType,
    since?: string | null,
    cursor?: string | null
  ): Promise<QuickBooksListPage>;
}

function entity(
  objectType: QuickBooksObjectType,
  id: string,
  organizationId: string,
  companyId: string,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): QuickBooksRawEntity {
  return {
    id,
    objectType,
    organizationId,
    companyId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? id },
  };
}

export function createDemoQuickBooksClient(seed = "quickbooks-demo"): QuickBooksClient {
  const orgId = "org-quickbooks-demo";
  const companyId = "qb-company-demo";
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-10T12:00:00.000Z";
  const monthAgo = "2026-06-15T12:00:00.000Z";
  void seed;

  const companies: QuickBooksCompany[] = [
    {
      companyId,
      companyName: "JAG Demo Academy Books",
      country: "US",
      currency: "USD",
      fiscalYearStartMonth: 7,
    },
    {
      companyId: "qb-company-alt",
      companyName: "Alt Entity Books",
      country: "US",
      currency: "USD",
      fiscalYearStartMonth: 1,
    },
  ];

  const catalog: QuickBooksRawEntity[] = [
    entity("company", companyId, orgId, companyId, 3, {
      name: "JAG Demo Academy Books",
      legalName: "JAG Demo Academy Inc.",
      fiscalYearStartMonth: 7,
      baseCurrency: "USD",
      country: "US",
    }, now),

    entity("account", "acc-1000", orgId, companyId, 2, {
      name: "Operating Checking",
      accountType: "Bank",
      accountSubType: "Checking",
      balance: 412500,
      active: true,
      parentAccountId: null,
    }, now),
    entity("account", "acc-1100", orgId, companyId, 2, {
      name: "Accounts Receivable",
      accountType: "Accounts Receivable",
      balance: 186400,
      active: true,
    }, now),
    entity("account", "acc-2000", orgId, companyId, 2, {
      name: "Accounts Payable",
      accountType: "Accounts Payable",
      balance: 64200,
      active: true,
    }, now),
    entity("account", "acc-4000", orgId, companyId, 2, {
      name: "Tuition Revenue",
      accountType: "Income",
      balance: 0,
      active: true,
    }, now),
    entity("account", "acc-5000", orgId, companyId, 2, {
      name: "Payroll Expense",
      accountType: "Expense",
      balance: 0,
      active: true,
    }, now),
    entity("account", "acc-5100", orgId, companyId, 1, {
      name: "Facilities (inactive)",
      accountType: "Expense",
      balance: 0,
      active: false,
    }, earlier),

    entity("customer", "cust-1", orgId, companyId, 3, {
      name: "Family Lee",
      balance: 4200,
      email: "lee@example.com",
      active: true,
    }, now),
    entity("customer", "cust-2", orgId, companyId, 2, {
      name: "Family Chen",
      balance: 0,
      email: "chen@example.com",
      active: true,
    }, earlier),
    entity("customer", "cust-3", orgId, companyId, 2, {
      name: "District Partner",
      balance: 18500,
      active: true,
    }, now),

    entity("vendor", "vend-1", orgId, companyId, 2, {
      name: "Campus Facilities Co",
      balance: 12500,
      active: true,
    }, now),
    entity("vendor", "vend-2", orgId, companyId, 1, {
      name: "EduSoft Licensing",
      balance: 4800,
      active: true,
    }, earlier),

    entity("item", "item-tuition", orgId, companyId, 2, {
      name: "Tuition — Semester",
      type: "Service",
      unitPrice: 6500,
      active: true,
    }, now),
    entity("item", "item-lunch", orgId, companyId, 1, {
      name: "Meal Plan",
      type: "Product",
      unitPrice: 450,
      active: true,
    }, earlier),

    entity("invoice", "inv-1001", orgId, companyId, 2, {
      name: "Invoice 1001",
      customerId: "cust-1",
      status: "PAID",
      totalAmt: 6500,
      balance: 0,
      dueDate: earlier,
      txnDate: monthAgo,
    }, earlier),
    entity("invoice", "inv-1002", orgId, companyId, 2, {
      name: "Invoice 1002",
      customerId: "cust-3",
      status: "SENT",
      totalAmt: 18500,
      balance: 18500,
      dueDate: "2026-07-25T00:00:00.000Z",
      txnDate: now,
    }, now),
    entity("invoice", "inv-1003", orgId, companyId, 1, {
      name: "Invoice 1003",
      customerId: "cust-1",
      status: "OVERDUE",
      totalAmt: 4200,
      balance: 4200,
      dueDate: monthAgo,
      txnDate: monthAgo,
    }, now),
    entity("invoice", "inv-1004", orgId, companyId, 1, {
      name: "Invoice 1004",
      customerId: "cust-2",
      status: "DRAFT",
      totalAmt: 6500,
      balance: 6500,
      txnDate: now,
    }, now),

    entity("bill", "bill-2001", orgId, companyId, 2, {
      name: "Bill 2001",
      vendorId: "vend-1",
      status: "OPEN",
      totalAmt: 12500,
      balance: 12500,
      dueDate: "2026-07-20T00:00:00.000Z",
    }, now),
    entity("bill", "bill-2002", orgId, companyId, 1, {
      name: "Bill 2002",
      vendorId: "vend-2",
      status: "PAID",
      totalAmt: 4800,
      balance: 0,
      dueDate: earlier,
    }, earlier),
    entity("bill", "bill-2003", orgId, companyId, 1, {
      name: "Bill 2003",
      vendorId: "vend-1",
      status: "OVERDUE",
      totalAmt: 3200,
      balance: 3200,
      dueDate: monthAgo,
    }, now),

    entity("payment", "pay-3001", orgId, companyId, 2, {
      name: "Payment 3001",
      customerId: "cust-1",
      totalAmt: 6500,
      txnDate: earlier,
    }, earlier),
    entity("payment", "pay-3002", orgId, companyId, 1, {
      name: "Payment 3002",
      customerId: "cust-2",
      totalAmt: 450,
      txnDate: now,
    }, now),

    entity("bill_payment", "bpay-3101", orgId, companyId, 1, {
      name: "Bill payment 3101",
      vendorId: "vend-2",
      totalAmt: 4800,
      txnDate: earlier,
    }, earlier),

    entity("journal_entry", "je-4001", orgId, companyId, 1, {
      name: "JE accrual payroll",
      totalAmt: 82000,
      txnDate: earlier,
    }, earlier),

    entity("expense", "exp-5001", orgId, companyId, 2, {
      name: "Utilities July",
      totalAmt: 6400,
      accountId: "acc-5000",
      txnDate: now,
    }, now),
    entity("expense", "exp-5002", orgId, companyId, 1, {
      name: "Software licenses",
      totalAmt: 2800,
      accountId: "acc-5000",
      txnDate: earlier,
    }, earlier),

    entity("deposit", "dep-6001", orgId, companyId, 1, {
      name: "Tuition deposit batch",
      totalAmt: 128000,
      txnDate: earlier,
    }, earlier),

    entity("transfer", "xfer-7001", orgId, companyId, 1, {
      name: "Sweep to reserves",
      totalAmt: 25000,
      txnDate: earlier,
    }, earlier),

    entity("credit_memo", "cm-8001", orgId, companyId, 1, {
      name: "Credit memo 8001",
      customerId: "cust-1",
      totalAmt: 250,
      txnDate: now,
    }, now),

    entity("budget", "bud-fy26", orgId, companyId, 2, {
      name: "FY26 Operating Budget",
      fiscalYear: 2026,
      revenueBudget: 4_800_000,
      expenseBudget: 4_450_000,
      actualRevenue: 4_120_000,
      actualExpense: 3_890_000,
    }, now),

    entity("class", "class-ops", orgId, companyId, 1, {
      name: "Operations",
      active: true,
    }, now),
    entity("class", "class-acad", orgId, companyId, 1, {
      name: "Academics",
      active: true,
    }, now),

    entity("location", "loc-main", orgId, companyId, 1, {
      name: "Main Campus",
      active: true,
    }, now),

    entity("attachment", "att-1", orgId, companyId, 1, {
      name: "Invoice 1002 PDF",
      relatedId: "inv-1002",
      contentType: "application/pdf",
    }, now),
  ];

  let selectedCompanyId = companyId;
  let environment: QuickBooksEnvironment = "sandbox";
  const PAGE_SIZE = 25;

  return {
    async authenticate(input) {
      if (!input.accessToken || input.accessToken === "invalid") {
        return { ok: false, error: "Invalid QuickBooks access token" };
      }
      environment = input.environment ?? "sandbox";
      selectedCompanyId = input.companyId ?? companyId;
      return {
        ok: true,
        session: {
          environment,
          accessToken: input.accessToken,
          refreshToken: `qb-refresh-${input.accessToken}`,
          expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
          companyId: selectedCompanyId,
          companies,
        },
      };
    },

    async refreshToken(refreshToken) {
      if (!refreshToken || refreshToken === "invalid") {
        return { ok: false, error: "Invalid QuickBooks refresh token" };
      }
      return {
        ok: true,
        accessToken: `qb-access-refreshed-${Date.now()}`,
        refreshToken: `qb-refresh-rotated-${Date.now()}`,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    },

    async listCompanies(accessToken) {
      if (!accessToken) return [];
      return companies;
    },

    async health() {
      return {
        ok: true,
        latencyMs: 22,
        environment,
        rateLimitRemaining: 460,
      };
    },

    async list(organizationId, objectType, since, cursor) {
      const orgOk =
        organizationId === orgId ||
        organizationId === "exec-demo-org" ||
        organizationId === "org-quickbooks-demo";
      if (!orgOk) return { records: [], nextCursor: null };

      const rows = catalog.filter((row) => {
        if (row.objectType !== objectType) return false;
        if (row.companyId !== selectedCompanyId && row.companyId !== companyId) return false;
        if (since && row.updatedAt < since) return false;
        return true;
      });

      const offset = cursor ? Number(cursor) || 0 : 0;
      const page = rows.slice(offset, offset + PAGE_SIZE);
      const next = offset + PAGE_SIZE < rows.length ? String(offset + PAGE_SIZE) : null;
      return { records: page, nextCursor: next };
    },
  };
}

export function allQuickBooksObjectTypes(): QuickBooksObjectType[] {
  return [...QUICKBOOKS_OBJECT_TYPES];
}
