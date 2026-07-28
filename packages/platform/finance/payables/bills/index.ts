/**
 * Bills facade — foundation + debit memos / recurring helpers.
 */

export {
  createBill,
  approveBill,
  payBill,
  payablesAging,
  listBills,
  listPayments,
} from "./legacy";

export { createDebitMemo, generateVendorStatement } from "../payments";
