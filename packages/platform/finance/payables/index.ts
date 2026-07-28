/**
 * JAG Payables™ — purchasing + AP (P-011) with P-008 foundation re-exports.
 */

export { PAYABLES_GUARDS } from "./types";
export type {
  PaymentMethod,
  PaymentRun,
  PurchaseOrder,
  PurchaseRequest,
  ReceivingRecord,
} from "./types";
export { resetPayablesStoreForTests } from "./store";
export { PayablesEngine, createPayablesEngine } from "./engine";

export {
  createBill,
  approveBill,
  payBill,
  payablesAging,
  listBills,
  listPayments,
} from "./bills";
