/**
 * PayablesEngine — purchasing + AP operations (P-011).
 */

import { approvePurchaseOrder } from "./approvals";
import {
  approveBill,
  createBill,
  listBills,
  listPayments,
  payablesAging,
  payBill,
} from "./bills";
import { vendor1099Ytd, list1099Vendors } from "./1099";
import {
  createDebitMemo,
  executePaymentRun,
  generateVendorStatement,
  listRuns,
  listSchedules,
  scheduleBillPayment,
} from "./payments";
import { createPurchaseOrder, listOrders, attachToPurchaseOrder } from "./purchase-orders";
import {
  approvePurchaseRequest,
  createPurchaseRequest,
  listRequests,
} from "./purchasing";
import {
  createVendorCredit,
  listReceipts,
  receivePurchaseOrderLine,
} from "./receiving";
import { createVendor, listVendors } from "./vendors";
import { PAYABLES_GUARDS } from "./types";
import {
  listEvidenceRecords,
  listMemoryRecords,
  listOperationalEvents,
  listTwinProjections,
  OPERATIONAL_SINKS,
} from "../operations/events";

export class PayablesEngine {
  readonly guards = PAYABLES_GUARDS;
  readonly sinks = OPERATIONAL_SINKS;

  // Vendors / foundation bills
  createVendor = createVendor;
  listVendors = listVendors;
  createBill = createBill;
  approveBill = approveBill;
  payBill = payBill;
  listBills = listBills;
  listPayments = listPayments;
  aging = payablesAging;

  // Purchasing
  createPurchaseRequest = createPurchaseRequest;
  approvePurchaseRequest = approvePurchaseRequest;
  listPurchaseRequests = listRequests;
  createPurchaseOrder = createPurchaseOrder;
  approvePurchaseOrder = approvePurchaseOrder;
  listPurchaseOrders = listOrders;
  attachToPurchaseOrder = attachToPurchaseOrder;
  receiveLine = receivePurchaseOrderLine;
  listReceipts = listReceipts;
  createVendorCredit = createVendorCredit;

  // Payments / 1099
  schedulePayment = scheduleBillPayment;
  executePaymentRun = executePaymentRun;
  listPaymentSchedules = listSchedules;
  listPaymentRuns = listRuns;
  createDebitMemo = createDebitMemo;
  vendorStatement = generateVendorStatement;
  vendor1099Ytd = vendor1099Ytd;
  list1099Vendors = list1099Vendors;

  // OIOS sinks
  listEvents = listOperationalEvents;
  listTwin = listTwinProjections;
  listEvidence = listEvidenceRecords;
  listMemory = listMemoryRecords;
}

export function createPayablesEngine(): PayablesEngine {
  return new PayablesEngine();
}
