/**
 * P008 — family financial profile column projections aligned to FamilyFinancialProfile DTO.
 */

export const FAMILY_PROFILE_COLS = "id, family_name, school_id" as const;

export const BILLING_ACCOUNT_COLS =
  "id, balance, credit_balance, collections_status, autopay_enabled, sibling_discount_percent" as const;

export const GUARDIAN_BILLING_COLS =
  "id, first_name, last_name, receives_billing, email, phone, financial_responsibility_percent" as const;

export const BILLING_PAYER_COLS =
  "id, payer_name, responsibility_percent, is_primary, custody_basis, guardians(first_name, last_name, receives_billing)" as const;

export const PAYMENT_METHOD_COLS =
  "id, method_type, last_four, is_default" as const;

export const AUTOPAY_COLS = "id, status, day_of_month" as const;

export const PAYMENT_PLAN_COLS =
  "id, name, total_amount, installment_amount, status" as const;

export const BILLING_CREDIT_COLS =
  "id, amount, remaining_amount, reason" as const;

export const INVOICE_PROFILE_COLS =
  "id, invoice_number, total_amount, amount_paid, invoice_status, due_date, family_responsibility, student_id" as const;

export const PAYMENT_PROFILE_COLS =
  "id, amount, payment_method, receipt_number, paid_at, invoices!inner(invoice_number, billing_account_id)" as const;

export const STATE_FUNDING_PROFILE_COLS =
  "id, funding_category, program_name, award_amount, verification_status, payment_status, renewal_date, state_code, student_id, students(first_name, last_name)" as const;

export const ADJUSTMENT_PROFILE_COLS =
  "id, adjustment_type, amount, reason, created_at" as const;

export const FI_ALERT_COLS =
  "id, alert_type, title, body, severity, school_id, entity_type, entity_id, mission_control_item_id, created_at, is_resolved" as const;

export const FI_ALERT_SYNC_COLS =
  "id, school_id, severity, title, body" as const;
