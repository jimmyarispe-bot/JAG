/**
 * P-011 — Payables™ operational types (purchasing + AP).
 */

import type { CurrencyCode } from "../types";

export type PurchaseRequestStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "converted";

export type PurchaseOrderStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "partially_received"
  | "received"
  | "closed"
  | "cancelled";

export type PaymentMethod =
  | "ach"
  | "check"
  | "wire"
  | "virtual_card"
  | "other";

export type PurchaseRequest = {
  readonly id: string;
  readonly organizationId: string;
  readonly requesterId: string;
  readonly vendorId: string | null;
  readonly description: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly status: PurchaseRequestStatus;
  readonly createdAt: string;
};

export type PurchaseOrderLine = {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly receivedQuantity: number;
};

export type PurchaseOrder = {
  readonly id: string;
  readonly organizationId: string;
  readonly vendorId: string;
  readonly purchaseRequestId: string | null;
  readonly status: PurchaseOrderStatus;
  readonly lines: readonly PurchaseOrderLine[];
  readonly currency: CurrencyCode;
  readonly total: number;
  readonly approvedBy: string | null;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly attachmentIds: readonly string[];
};

export type ReceivingRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly purchaseOrderId: string;
  readonly lineId: string;
  readonly quantity: number;
  readonly partial: boolean;
  readonly receivedAt: string;
  readonly receivedBy: string;
};

export type VendorCredit = {
  readonly id: string;
  readonly organizationId: string;
  readonly vendorId: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly memo: string;
  readonly billId: string | null;
  readonly createdAt: string;
};

export type PaymentScheduleItem = {
  readonly id: string;
  readonly organizationId: string;
  readonly billId: string;
  readonly scheduledAt: string;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly earlyDiscountAmount: number;
  readonly status: "scheduled" | "included_in_run" | "paid" | "cancelled";
};

export type PaymentRun = {
  readonly id: string;
  readonly organizationId: string;
  readonly method: PaymentMethod;
  readonly scheduleIds: readonly string[];
  readonly total: number;
  readonly currency: CurrencyCode;
  readonly executedAt: string;
  readonly executedBy: string;
};

export type DebitMemo = {
  readonly id: string;
  readonly organizationId: string;
  readonly vendorId: string;
  readonly amount: number;
  readonly memo: string;
  readonly createdAt: string;
};

export type VendorStatement = {
  readonly id: string;
  readonly organizationId: string;
  readonly vendorId: string;
  readonly periodKey: string;
  readonly balance: number;
  readonly generatedAt: string;
};

export const PAYABLES_GUARDS = Object.freeze({
  operationalPayables: true,
  includesFinancialStatements: false,
  includesForecasting: false,
  includesAiCfo: false,
  includesEbitda: false,
  virtualCardHookReady: true,
});
