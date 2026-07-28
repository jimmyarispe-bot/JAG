/**
 * RevenueEngine — billing, AR, collections, recognition (P-011).
 */

import { billCustomer, billSubscription } from "./billing";
import {
  collectionsAging,
  createPaymentPlan,
  listCollections,
  listPlans,
  listReminders,
  recordCollectionActivity,
  runDunning,
  upsertReminderRule,
} from "./collections";
import { createContract, listContracts } from "./contracts";
import { buildCustomerPortal } from "./customer-portal";
import {
  EDUCATION_FUNDING_PRESETS,
  listFunding,
  registerFundingSource,
  seedEducationFundingPresets,
} from "./funding";
import {
  createRevenueInvoice,
  listInvoiceMeta,
  listInvoices,
  sendRevenueInvoice,
} from "./invoices";
import {
  issueCreditMemo,
  listPayments,
  receiveCustomerPayment,
  refundPayment,
  writeOffInvoice,
} from "./payments";
import {
  deferRevenue,
  listRecognition,
  recognizeRevenue,
  recognitionSummary,
} from "./revenue-recognition";
import { createSubscription, listSubscriptions } from "./subscriptions";
import { REVENUE_GUARDS } from "./types";
import {
  listEvidenceRecords,
  listMemoryRecords,
  listOperationalEvents,
  listTwinProjections,
  OPERATIONAL_SINKS,
} from "../operations/events";

export class RevenueEngine {
  readonly guards = REVENUE_GUARDS;
  readonly sinks = OPERATIONAL_SINKS;
  readonly educationFundingPresets = EDUCATION_FUNDING_PRESETS;

  // Funding (configurable)
  registerFundingSource = registerFundingSource;
  seedEducationFundingPresets = seedEducationFundingPresets;
  listFundingSources = listFunding;

  // Contracts / subscriptions / billing
  createContract = createContract;
  listContracts = listContracts;
  createSubscription = createSubscription;
  listSubscriptions = listSubscriptions;
  billCustomer = billCustomer;
  billSubscription = billSubscription;

  // Invoices / payments
  createInvoice = createRevenueInvoice;
  sendInvoice = sendRevenueInvoice;
  listInvoices = listInvoices;
  listInvoiceMeta = listInvoiceMeta;
  receivePayment = receiveCustomerPayment;
  issueCreditMemo = issueCreditMemo;
  refundPayment = refundPayment;
  writeOffInvoice = writeOffInvoice;
  listPayments = listPayments;

  // Collections / recognition / portal
  recordCollection = recordCollectionActivity;
  createPaymentPlan = createPaymentPlan;
  upsertReminderRule = upsertReminderRule;
  runDunning = runDunning;
  collectionsAging = collectionsAging;
  listCollections = listCollections;
  listPaymentPlans = listPlans;
  listReminderRules = listReminders;
  recognizeRevenue = recognizeRevenue;
  deferRevenue = deferRevenue;
  recognitionSummary = recognitionSummary;
  listRecognition = listRecognition;
  customerPortal = buildCustomerPortal;

  // OIOS sinks
  listEvents = listOperationalEvents;
  listTwin = listTwinProjections;
  listEvidence = listEvidenceRecords;
  listMemory = listMemoryRecords;
}

export function createRevenueEngine(): RevenueEngine {
  return new RevenueEngine();
}
