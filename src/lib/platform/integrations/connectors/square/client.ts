/**
 * Square system-of-record client.
 * Demo store ships production-shaped payment data for sync/tests/ECC.
 * Live adapters implement the same interface (OAuth sandbox/production).
 */

import type { SquareAuthSession, SquareMerchant } from "./auth";
import type { SquareEnvironment, SquareObjectType, SquareRawEntity } from "./entities";
import { SQUARE_OBJECT_TYPES } from "./entities";

export type SquareListPage = {
  records: SquareRawEntity[];
  nextCursor: string | null;
};

export interface SquareClient {
  authenticate(input: {
    accessToken: string;
    environment?: SquareEnvironment;
    merchantId?: string;
  }): Promise<{ ok: boolean; error?: string; session?: SquareAuthSession }>;
  refreshToken(refreshToken: string): Promise<{
    ok: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    error?: string;
  }>;
  listMerchants(accessToken: string): Promise<SquareMerchant[]>;
  health(): Promise<{
    ok: boolean;
    latencyMs: number;
    environment: SquareEnvironment;
    rateLimitRemaining: number;
  }>;
  list(
    organizationId: string,
    objectType: SquareObjectType,
    since?: string | null,
    cursor?: string | null
  ): Promise<SquareListPage>;
}

function entity(
  objectType: SquareObjectType,
  id: string,
  organizationId: string,
  locationId: string | null,
  merchantId: string,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): SquareRawEntity {
  return {
    id,
    objectType,
    organizationId,
    locationId,
    merchantId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? id },
  };
}

/** Deterministic demo SoR for Square — expandable without live network. */
export function createDemoSquareClient(seed = "square-demo"): SquareClient {
  const orgId = "org-square-demo";
  const merchantId = "merchant-sq-demo";
  const locMain = "loc-main-store";
  const locCafe = "loc-cafe";
  const now = "2026-07-13T14:30:00.000Z";
  const earlier = "2026-07-12T18:00:00.000Z";
  const yesterday = "2026-07-11T16:00:00.000Z";

  void seed;

  const merchants: SquareMerchant[] = [
    {
      merchantId,
      businessName: "Square Demo Merchant",
      country: "US",
      currency: "USD",
      mainLocationId: locMain,
    },
    {
      merchantId: "merchant-sq-alt",
      businessName: "Square Alt Merchant",
      country: "US",
      currency: "USD",
      mainLocationId: null,
    },
  ];

  const catalog: SquareRawEntity[] = [
    entity("location", locMain, orgId, locMain, merchantId, 2, {
      name: "Main Store",
      kind: "store",
      address: "100 Commerce Ave",
      timezone: "America/New_York",
      status: "active",
    }, now),
    entity("location", locCafe, orgId, locCafe, merchantId, 2, {
      name: "Campus Cafe",
      kind: "store",
      address: "12 Student Union",
      timezone: "America/New_York",
      status: "active",
    }, earlier),
    entity("device", "dev-pos-1", orgId, locMain, merchantId, 1, {
      name: "Front Register Device",
      status: "online",
      model: "Square Terminal",
    }, now),
    entity("device", "dev-pos-2", orgId, locCafe, merchantId, 1, {
      name: "Cafe Terminal",
      status: "online",
      model: "Square Register",
    }, earlier),
    entity("register", "reg-1", orgId, locMain, merchantId, 1, {
      name: "Register 1",
      deviceId: "dev-pos-1",
      status: "open",
    }, now),
    entity("register", "reg-2", orgId, locCafe, merchantId, 1, {
      name: "Cafe Register",
      deviceId: "dev-pos-2",
      status: "open",
    }, earlier),

    entity("customer", "cust-1001", orgId, locMain, merchantId, 4, {
      name: "Jordan Lee",
      email: "jordan.lee@example.com",
      phone: "+1-404-555-0101",
      lifetimeValueCents: 84250,
      purchaseCount: 18,
      lastPurchaseAt: now,
    }, now),
    entity("customer", "cust-1002", orgId, locCafe, merchantId, 3, {
      name: "Sam Rivera",
      email: "sam.rivera@example.com",
      phone: "+1-404-555-0102",
      lifetimeValueCents: 21400,
      purchaseCount: 7,
      lastPurchaseAt: earlier,
    }, earlier),
    entity("customer", "cust-1003", orgId, locMain, merchantId, 2, {
      name: "Avery Chen",
      email: "avery.chen@example.com",
      lifetimeValueCents: 126500,
      purchaseCount: 32,
      lastPurchaseAt: yesterday,
      groupIds: ["grp-vip"],
    }, yesterday),

    entity("customer_group", "grp-vip", orgId, null, merchantId, 1, {
      name: "VIP Families",
      customerIds: ["cust-1001", "cust-1003"],
    }, now),
    entity("customer_group", "grp-cafe", orgId, locCafe, merchantId, 1, {
      name: "Cafe Regulars",
      customerIds: ["cust-1002"],
    }, earlier),

    entity("employee", "emp-1", orgId, locMain, merchantId, 1, {
      name: "Casey Morgan",
      role: "manager",
      status: "active",
    }, now),
    entity("employee", "emp-2", orgId, locCafe, merchantId, 1, {
      name: "Riley Quinn",
      role: "cashier",
      status: "active",
    }, earlier),

    entity("order_line_item", "oli-7001-1", orgId, locCafe, merchantId, 1, {
      name: "House Coffee",
      orderId: "ord-7001",
      quantity: 2,
      amountCents: 700,
      catalogItemId: "item-coffee",
    }, now),
    entity("order_line_item", "oli-7001-2", orgId, locCafe, merchantId, 1, {
      name: "Pastry",
      orderId: "ord-7001",
      quantity: 1,
      amountCents: 550,
    }, now),
    entity("order_line_item", "oli-7002-1", orgId, locMain, merchantId, 1, {
      name: "Academy Hoodie",
      orderId: "ord-7002",
      quantity: 1,
      amountCents: 4500,
      catalogItemId: "item-hoodie",
    }, earlier),

    entity("catalog_category", "cat-food", orgId, null, merchantId, 1, {
      name: "Food & Beverage",
    }, now),
    entity("catalog_category", "cat-merch", orgId, null, merchantId, 1, {
      name: "Merchandise",
    }, now),
    entity("catalog_item", "item-coffee", orgId, locCafe, merchantId, 3, {
      name: "House Coffee",
      categoryId: "cat-food",
      description: "12oz drip",
    }, now),
    entity("catalog_item", "item-hoodie", orgId, locMain, merchantId, 2, {
      name: "Academy Hoodie",
      categoryId: "cat-merch",
      description: "Unisex midweight",
    }, earlier),
    entity("catalog_variation", "var-coffee-12", orgId, locCafe, merchantId, 2, {
      name: "12oz",
      itemId: "item-coffee",
      priceCents: 350,
      currency: "USD",
    }, now),
    entity("catalog_variation", "var-hoodie-m", orgId, locMain, merchantId, 2, {
      name: "Medium",
      itemId: "item-hoodie",
      priceCents: 4500,
      currency: "USD",
    }, earlier),

    entity("order", "ord-7001", orgId, locCafe, merchantId, 2, {
      name: "Order #7001",
      customerId: "cust-1001",
      state: "COMPLETED",
      totalCents: 1250,
      discountCents: 0,
      taxCents: 95,
      tipCents: 200,
      lineItems: [
        { name: "House Coffee", quantity: 2, amountCents: 700 },
        { name: "Pastry", quantity: 1, amountCents: 550 },
      ],
      createdAt: now,
    }, now),
    entity("order", "ord-7002", orgId, locMain, merchantId, 2, {
      name: "Order #7002",
      customerId: "cust-1003",
      state: "COMPLETED",
      totalCents: 4500,
      discountCents: 500,
      taxCents: 320,
      tipCents: 0,
      lineItems: [{ name: "Academy Hoodie", quantity: 1, amountCents: 4500 }],
      createdAt: earlier,
    }, earlier),

    entity("payment", "pay-8001", orgId, locCafe, merchantId, 2, {
      name: "Payment pay-8001",
      orderId: "ord-7001",
      customerId: "cust-1001",
      amountCents: 1250,
      tipCents: 200,
      taxCents: 95,
      feeCents: 42,
      currency: "USD",
      status: "COMPLETED",
      sourceType: "CARD",
      createdAt: now,
    }, now),
    entity("payment", "pay-8002", orgId, locMain, merchantId, 2, {
      name: "Payment pay-8002",
      orderId: "ord-7002",
      customerId: "cust-1003",
      amountCents: 4500,
      tipCents: 0,
      taxCents: 320,
      feeCents: 118,
      currency: "USD",
      status: "COMPLETED",
      sourceType: "CARD",
      createdAt: earlier,
    }, earlier),
    entity("payment", "pay-8003", orgId, locMain, merchantId, 1, {
      name: "Payment pay-8003",
      customerId: "cust-1002",
      amountCents: 2800,
      tipCents: 400,
      taxCents: 210,
      feeCents: 75,
      currency: "USD",
      status: "COMPLETED",
      sourceType: "CARD",
      createdAt: yesterday,
    }, yesterday),
    entity("payment", "pay-8004", orgId, locCafe, merchantId, 1, {
      name: "Payment pay-8004",
      amountCents: 980,
      tipCents: 100,
      taxCents: 70,
      feeCents: 30,
      currency: "USD",
      status: "COMPLETED",
      sourceType: "CASH",
      createdAt: "2026-07-13T09:15:00.000Z",
    }, "2026-07-13T09:15:00.000Z"),

    entity("refund", "ref-8101", orgId, locMain, merchantId, 1, {
      name: "Refund ref-8101",
      paymentId: "pay-8002",
      amountCents: 4500,
      reason: "Customer return",
      status: "COMPLETED",
      createdAt: now,
    }, now),

    entity("deposit", "dep-8201", orgId, null, merchantId, 1, {
      name: "Deposit 2026-07-12",
      /** $127,500 — intentional $500 gap vs QuickBooks $128,000 for reconciliation demos */
      amountCents: 12_750_000,
      currency: "USD",
      status: "COMPLETED",
      arrivedAt: earlier,
    }, earlier),
    entity("deposit", "dep-8202", orgId, null, merchantId, 1, {
      name: "Deposit pending",
      amountCents: 6_240_000,
      currency: "USD",
      status: "PENDING",
      arrivedAt: null,
      expectedAt: "2026-07-14T12:00:00.000Z",
    }, now),

    entity("fee", "fee-8301", orgId, locCafe, merchantId, 1, {
      name: "Processing fee",
      paymentId: "pay-8001",
      amountCents: 42,
      currency: "USD",
    }, now),
    entity("tip", "tip-8401", orgId, locCafe, merchantId, 1, {
      name: "Tip",
      paymentId: "pay-8001",
      amountCents: 200,
      currency: "USD",
    }, now),
    entity("tax", "tax-8501", orgId, locCafe, merchantId, 1, {
      name: "Sales tax",
      paymentId: "pay-8001",
      amountCents: 95,
      currency: "USD",
      rate: 0.08,
    }, now),

    entity("invoice", "inv-9001", orgId, locMain, merchantId, 2, {
      name: "Invoice INV-9001",
      customerId: "cust-1003",
      status: "PAID",
      amountCents: 12000,
      dueAt: earlier,
      paidAt: earlier,
    }, earlier),
    entity("invoice", "inv-9002", orgId, locMain, merchantId, 1, {
      name: "Invoice INV-9002",
      customerId: "cust-1001",
      status: "OPEN",
      amountCents: 8500,
      dueAt: "2026-07-20T00:00:00.000Z",
    }, now),
    entity("invoice", "inv-9003", orgId, locCafe, merchantId, 1, {
      name: "Invoice INV-9003",
      customerId: "cust-1002",
      status: "OVERDUE",
      amountCents: 3200,
      dueAt: yesterday,
    }, yesterday),
    entity("invoice", "inv-9004", orgId, locMain, merchantId, 1, {
      name: "Invoice INV-9004",
      customerId: "cust-1001",
      status: "DRAFT",
      amountCents: 5000,
    }, now),

    entity("subscription", "sub-9101", orgId, locMain, merchantId, 2, {
      name: "Monthly meal plan",
      customerId: "cust-1001",
      status: "ACTIVE",
      amountCents: 8900,
      interval: "MONTHLY",
      nextBillingAt: "2026-08-01T00:00:00.000Z",
    }, now),
    entity("subscription", "sub-9102", orgId, locMain, merchantId, 1, {
      name: "Alumni membership",
      customerId: "cust-1003",
      status: "CANCELLED",
      amountCents: 2500,
      interval: "MONTHLY",
      cancelledAt: yesterday,
    }, yesterday),
    entity("subscription", "sub-9103", orgId, locCafe, merchantId, 1, {
      name: "Coffee club",
      customerId: "cust-1002",
      status: "ACTIVE",
      amountCents: 2500,
      interval: "MONTHLY",
      renewalCount: 6,
      nextBillingAt: "2026-07-28T00:00:00.000Z",
    }, now),

    entity("gift_card", "gc-9201", orgId, locMain, merchantId, 2, {
      name: "Gift card ****4211",
      balanceCents: 4500,
      currency: "USD",
      status: "ACTIVE",
      purchasedAt: earlier,
      lastRedeemedAt: now,
    }, now),
    entity("gift_card", "gc-9202", orgId, locCafe, merchantId, 1, {
      name: "Gift card ****8830",
      balanceCents: 12000,
      currency: "USD",
      status: "ACTIVE",
      purchasedAt: yesterday,
    }, yesterday),
  ];

  let selectedMerchantId = merchantId;
  let environment: SquareEnvironment = "sandbox";
  const PAGE_SIZE = 25;

  return {
    async authenticate(input) {
      if (!input.accessToken || input.accessToken === "invalid") {
        return { ok: false, error: "Invalid Square access token" };
      }
      environment = input.environment ?? "sandbox";
      selectedMerchantId = input.merchantId ?? merchantId;
      const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
      return {
        ok: true,
        session: {
          environment,
          accessToken: input.accessToken,
          refreshToken: `refresh-${input.accessToken}`,
          expiresAt,
          merchantId: selectedMerchantId,
          merchants,
        },
      };
    },

    async refreshToken(refreshToken) {
      if (!refreshToken || refreshToken === "invalid") {
        return { ok: false, error: "Invalid Square refresh token" };
      }
      return {
        ok: true,
        accessToken: `access-refreshed-${Date.now()}`,
        refreshToken: `refresh-rotated-${Date.now()}`,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    },

    async listMerchants(accessToken) {
      if (!accessToken) return [];
      return merchants;
    },

    async health() {
      return {
        ok: true,
        latencyMs: 18,
        environment,
        rateLimitRemaining: 980,
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
        if (row.merchantId && selectedMerchantId && row.merchantId !== selectedMerchantId) {
          if (row.merchantId !== merchantId) return false;
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

export function allSquareObjectTypes(): SquareObjectType[] {
  return [...SQUARE_OBJECT_TYPES];
}
