/**
 * Plaid system-of-record client.
 * Demo store ships production-shaped banking data for sync/tests/ECC.
 * Live adapters implement the same interface (Plaid Link sandbox/dev/production).
 */

import type { PlaidAuthSession, PlaidInstitution } from "./auth";
import type { PlaidEnvironment, PlaidObjectType, PlaidRawEntity } from "./entities";
import { PLAID_OBJECT_TYPES } from "./entities";

export type PlaidListPage = {
  records: PlaidRawEntity[];
  nextCursor: string | null;
};

export interface PlaidClient {
  authenticate(input: {
    accessToken: string;
    environment?: PlaidEnvironment;
    institutionId?: string;
    publicToken?: string;
  }): Promise<{ ok: boolean; error?: string; session?: PlaidAuthSession }>;
  createLinkToken(input: {
    environment?: PlaidEnvironment;
    clientUserId: string;
  }): Promise<{ ok: boolean; linkToken?: string; expiration?: string; error?: string }>;
  exchangePublicToken(publicToken: string): Promise<{
    ok: boolean;
    accessToken?: string;
    itemId?: string;
    error?: string;
  }>;
  refreshToken(refreshToken: string): Promise<{
    ok: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    error?: string;
  }>;
  listInstitutions(accessToken: string): Promise<PlaidInstitution[]>;
  health(): Promise<{
    ok: boolean;
    latencyMs: number;
    environment: PlaidEnvironment;
    rateLimitRemaining: number;
    institutionHealth: "healthy" | "degraded" | "error";
  }>;
  list(
    organizationId: string,
    objectType: PlaidObjectType,
    since?: string | null,
    cursor?: string | null
  ): Promise<PlaidListPage>;
}

function entity(
  objectType: PlaidObjectType,
  id: string,
  organizationId: string,
  institutionId: string | null,
  accountId: string | null,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): PlaidRawEntity {
  return {
    id,
    objectType,
    organizationId,
    institutionId,
    accountId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? id },
  };
}

/** Deterministic demo SoR for Plaid — expandable without live network. */
export function createDemoPlaidClient(seed = "plaid-demo"): PlaidClient {
  const orgId = "org-plaid-demo";
  const institutionId = "ins-chase-demo";
  const itemId = "item-plaid-demo";
  const acctChecking = "acc-checking-1001";
  const acctSavings = "acc-savings-1002";
  const acctCredit = "acc-credit-2001";
  const acctLoan = "acc-loan-3001";
  const acctLoc = "acc-loc-3002";
  const now = "2026-07-13T15:00:00.000Z";
  const earlier = "2026-07-12T18:00:00.000Z";
  const yesterday = "2026-07-11T12:00:00.000Z";
  void seed;

  const institutions: PlaidInstitution[] = [
    {
      institutionId,
      name: "Chase Demo Bank",
      products: ["transactions", "auth", "identity", "liabilities", "investments"],
      countryCodes: ["US"],
    },
    {
      institutionId: "ins-bofa-demo",
      name: "Bank of America Demo",
      products: ["transactions", "auth"],
      countryCodes: ["US"],
    },
  ];

  let selectedInstitutionId = institutionId;
  let environment: PlaidEnvironment = "sandbox";

  /**
   * Demo balances chosen for cross-system reconciliation:
   * - Checking current $411,800 vs QuickBooks Bank $412,500 (Δ $700)
   * - Square merchant deposits $127,500 vs bank merchant deposits $127,000 (Δ $500 missing)
   */
  const catalog: PlaidRawEntity[] = [
    entity("institution", institutionId, orgId, institutionId, null, 1, {
      name: "Chase Demo Bank",
      status: "connected",
      products: institutions[0]!.products,
    }, now),

    entity("account", acctChecking, orgId, institutionId, acctChecking, 2, {
      name: "Business Checking ····4412",
      subtype: "checking",
      type: "depository",
      mask: "4412",
      currency: "USD",
      status: "active",
    }, now),
    entity("account", acctSavings, orgId, institutionId, acctSavings, 1, {
      name: "Operating Savings ····8821",
      subtype: "savings",
      type: "depository",
      mask: "8821",
      currency: "USD",
      status: "active",
    }, earlier),
    entity("account", acctCredit, orgId, institutionId, acctCredit, 1, {
      name: "Corporate Card ····0199",
      subtype: "credit card",
      type: "credit",
      mask: "0199",
      currency: "USD",
      status: "active",
    }, earlier),
    entity("account", acctLoan, orgId, institutionId, acctLoan, 1, {
      name: "Equipment Loan",
      subtype: "loan",
      type: "loan",
      mask: "3301",
      currency: "USD",
      status: "active",
    }, yesterday),
    entity("account", acctLoc, orgId, institutionId, acctLoc, 1, {
      name: "Line of Credit",
      subtype: "line of credit",
      type: "loan",
      mask: "5502",
      currency: "USD",
      status: "active",
    }, yesterday),

    entity("balance", "bal-checking", orgId, institutionId, acctChecking, 2, {
      name: "Checking balances",
      available: 398_200,
      current: 411_800,
      pending: 13_600,
      currency: "USD",
      /** Intentional $700 gap vs QuickBooks Bank cash $412,500 */
      limit: null,
    }, now),
    entity("balance", "bal-savings", orgId, institutionId, acctSavings, 1, {
      name: "Savings balances",
      available: 186_000,
      current: 186_400,
      pending: 0,
      currency: "USD",
      limit: null,
    }, now),
    entity("balance", "bal-credit", orgId, institutionId, acctCredit, 1, {
      name: "Credit balances",
      available: 42_000,
      current: -8_400,
      pending: 1_200,
      currency: "USD",
      limit: 50_000,
    }, now),

    // Square merchant deposit — $500 short vs Square completed deposits $127,500
    entity("transaction", "txn-dep-sq-1", orgId, institutionId, acctChecking, 1, {
      name: "Square Inc Merchant Deposit",
      amount: 127_000,
      currency: "USD",
      direction: "inflow",
      category: "deposit",
      channel: "ach",
      merchantName: "Square",
      pending: false,
      date: earlier.slice(0, 10),
      postedAt: earlier,
    }, earlier),
    entity("transaction", "txn-dep-tuition", orgId, institutionId, acctChecking, 1, {
      name: "Tuition ACH batch",
      amount: 48_500,
      currency: "USD",
      direction: "inflow",
      category: "deposit",
      channel: "ach",
      pending: false,
      date: yesterday.slice(0, 10),
      postedAt: yesterday,
    }, yesterday),
    entity("transaction", "txn-wire-in", orgId, institutionId, acctChecking, 1, {
      name: "Grant wire inbound",
      amount: 25_000,
      currency: "USD",
      direction: "inflow",
      category: "deposit",
      channel: "wire",
      pending: false,
      date: "2026-07-09",
      postedAt: "2026-07-09T16:00:00.000Z",
    }, "2026-07-09T16:00:00.000Z"),
    entity("transaction", "txn-check-out", orgId, institutionId, acctChecking, 1, {
      name: "Vendor check #4412",
      amount: -3_200,
      currency: "USD",
      direction: "outflow",
      category: "withdrawal",
      channel: "check",
      pending: false,
      date: yesterday.slice(0, 10),
      postedAt: yesterday,
    }, yesterday),
    entity("transaction", "txn-card-1", orgId, institutionId, acctCredit, 1, {
      name: "Office supplies card",
      amount: -412.55,
      currency: "USD",
      direction: "outflow",
      category: "card",
      channel: "card",
      pending: false,
      date: now.slice(0, 10),
      postedAt: now,
    }, now),
    entity("transaction", "txn-ach-out", orgId, institutionId, acctChecking, 1, {
      name: "Payroll ACH",
      amount: -62_400,
      currency: "USD",
      direction: "outflow",
      category: "withdrawal",
      channel: "ach",
      pending: false,
      date: earlier.slice(0, 10),
      postedAt: earlier,
    }, earlier),
    entity("transaction", "txn-fee-1", orgId, institutionId, acctChecking, 1, {
      name: "Monthly account fee",
      amount: -45,
      currency: "USD",
      direction: "outflow",
      category: "bank_fee",
      channel: "fee",
      pending: false,
      date: now.slice(0, 10),
      postedAt: now,
    }, now),
    entity("transaction", "txn-return-1", orgId, institutionId, acctChecking, 1, {
      name: "Returned ACH payment",
      amount: -250,
      currency: "USD",
      direction: "outflow",
      category: "returned_payment",
      channel: "ach",
      pending: false,
      date: yesterday.slice(0, 10),
      postedAt: yesterday,
    }, yesterday),
    // Duplicate deposit pair for reconciliation demos
    entity("transaction", "txn-dup-a", orgId, institutionId, acctChecking, 1, {
      name: "Square Inc Merchant Deposit",
      amount: 5_000,
      currency: "USD",
      direction: "inflow",
      category: "deposit",
      channel: "ach",
      merchantName: "Square",
      pending: false,
      date: "2026-07-08",
      postedAt: "2026-07-08T14:00:00.000Z",
    }, "2026-07-08T14:00:00.000Z"),
    entity("transaction", "txn-dup-b", orgId, institutionId, acctChecking, 1, {
      name: "Square Inc Merchant Deposit",
      amount: 5_000,
      currency: "USD",
      direction: "inflow",
      category: "deposit",
      channel: "ach",
      merchantName: "Square",
      pending: false,
      date: "2026-07-08",
      postedAt: "2026-07-08T14:05:00.000Z",
    }, "2026-07-08T14:05:00.000Z"),
    entity("transaction", "txn-pending-ach", orgId, institutionId, acctChecking, 1, {
      name: "Pending ACH settlement",
      amount: 8_200,
      currency: "USD",
      direction: "inflow",
      category: "deposit",
      channel: "ach",
      pending: true,
      date: now.slice(0, 10),
      postedAt: null,
    }, now),

    entity("transfer", "xfer-1", orgId, institutionId, acctChecking, 1, {
      name: "Sweep to savings",
      amount: 10_000,
      currency: "USD",
      fromAccountId: acctChecking,
      toAccountId: acctSavings,
      status: "posted",
      date: earlier.slice(0, 10),
    }, earlier),

    entity("liability", "liab-mortgage", orgId, institutionId, acctLoan, 1, {
      name: "Campus mortgage",
      type: "mortgage",
      balance: 1_250_000,
      interestRate: 0.0525,
      minimumPayment: 6_800,
      nextPaymentDue: "2026-08-01",
    }, now),
    entity("liability", "liab-student", orgId, institutionId, null, 1, {
      name: "Staff education loan pool",
      type: "student",
      balance: 42_000,
      interestRate: 0.045,
      minimumPayment: 380,
      nextPaymentDue: "2026-08-05",
    }, earlier),
    entity("liability", "liab-auto", orgId, institutionId, null, 1, {
      name: "Fleet auto loan",
      type: "auto",
      balance: 28_500,
      interestRate: 0.061,
      minimumPayment: 520,
      nextPaymentDue: "2026-07-28",
    }, earlier),
    entity("liability", "liab-credit", orgId, institutionId, acctCredit, 1, {
      name: "Corporate card liability",
      type: "credit",
      balance: 8_400,
      interestRate: 0.1899,
      minimumPayment: 250,
      nextPaymentDue: "2026-07-25",
      lastPaymentAmount: 1_500,
    }, now),

    entity("security", "sec-etf-1", orgId, institutionId, null, 1, {
      name: "Vanguard Total Stock ETF",
      ticker: "VTI",
      type: "etf",
      closePrice: 268.4,
      currency: "USD",
    }, now),
    entity("security", "sec-bond-1", orgId, institutionId, null, 1, {
      name: "US Treasury Note",
      ticker: "UST-26",
      type: "fixed income",
      closePrice: 99.12,
      currency: "USD",
    }, earlier),

    entity("holding", "hold-1", orgId, institutionId, acctSavings, 1, {
      name: "VTI holding",
      securityId: "sec-etf-1",
      quantity: 120,
      institutionValue: 32_208,
      costBasis: 28_500,
    }, now),
    entity("holding", "hold-2", orgId, institutionId, acctSavings, 1, {
      name: "Treasury holding",
      securityId: "sec-bond-1",
      quantity: 50,
      institutionValue: 4_956,
      costBasis: 5_000,
    }, earlier),

    entity("investment_performance", "perf-1", orgId, institutionId, acctSavings, 1, {
      name: "YTD portfolio performance",
      returnPct: 0.068,
      unrealizedGain: 3_664,
      period: "ytd",
    }, now),

    entity("identity", "id-owner-1", orgId, institutionId, acctChecking, 1, {
      name: "Account owner",
      owners: [
        {
          names: ["JAG Demo Academy"],
          emails: [{ data: "finance@jag-demo.example", primary: true }],
          phoneNumbers: [{ data: "+1-555-0100", primary: true }],
        },
      ],
    }, now),
  ];

  const PAGE_SIZE = 25;

  return {
    async authenticate(input) {
      if (!input.accessToken || input.accessToken === "invalid") {
        return { ok: false, error: "Invalid Plaid access token" };
      }
      environment = input.environment ?? "sandbox";
      selectedInstitutionId = input.institutionId ?? institutionId;
      const expiresAt = new Date(Date.now() + 30 * 24 * 3_600_000).toISOString();
      return {
        ok: true,
        session: {
          environment,
          accessToken: input.accessToken.startsWith("access-")
            ? input.accessToken
            : `access-${input.accessToken}`,
          refreshToken: `refresh-${input.accessToken}`,
          expiresAt,
          itemId,
          institutionId: selectedInstitutionId,
          institutions,
          linkToken: `link-sandbox-${Date.now()}`,
        },
      };
    },

    async createLinkToken(input) {
      environment = input.environment ?? "sandbox";
      if (!input.clientUserId) return { ok: false, error: "clientUserId required" };
      return {
        ok: true,
        linkToken: `link-${environment}-${input.clientUserId}`,
        expiration: new Date(Date.now() + 4 * 3_600_000).toISOString(),
      };
    },

    async exchangePublicToken(publicToken) {
      if (!publicToken || publicToken === "invalid") {
        return { ok: false, error: "Invalid public token" };
      }
      return {
        ok: true,
        accessToken: `access-exchanged-${publicToken}`,
        itemId,
      };
    },

    async refreshToken(refreshToken) {
      if (!refreshToken || refreshToken === "invalid") {
        return { ok: false, error: "Invalid Plaid refresh / item token" };
      }
      return {
        ok: true,
        accessToken: `access-refreshed-${Date.now()}`,
        refreshToken: `refresh-rotated-${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 3_600_000).toISOString(),
      };
    },

    async listInstitutions(accessToken) {
      if (!accessToken) return [];
      return institutions;
    },

    async health() {
      return {
        ok: true,
        latencyMs: 22,
        environment,
        rateLimitRemaining: 920,
        institutionHealth: "healthy",
      };
    },

    async list(organizationId, objectType, since, cursor) {
      const rows = catalog.filter((row) => {
        const orgOk =
          row.organizationId === organizationId ||
          organizationId === "exec-demo-org" ||
          organizationId === orgId;
        if (!orgOk) return false;
        if (row.objectType !== objectType) return false;
        if (since && row.updatedAt < since) return false;
        if (
          row.institutionId &&
          selectedInstitutionId &&
          row.institutionId !== selectedInstitutionId &&
          row.institutionId !== institutionId
        ) {
          return false;
        }
        return true;
      });
      const offset = cursor ? Number(cursor) || 0 : 0;
      const page = rows.slice(offset, offset + PAGE_SIZE);
      const next = offset + PAGE_SIZE < rows.length ? String(offset + PAGE_SIZE) : null;
      return { records: page, nextCursor: next };
    },
  };
}

export function allPlaidObjectTypes(): PlaidObjectType[] {
  return [...PLAID_OBJECT_TYPES];
}
