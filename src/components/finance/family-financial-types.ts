export type StudentRef = { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;

export function studentLabel(students: StudentRef) {
  if (!students) return "Student";
  const s = Array.isArray(students) ? students[0] : students;
  return s ? `${s.first_name} ${s.last_name}` : "Student";
}

export interface FamilyFinancialProfile {
  family: { id: string; family_name: string; school_id: string };
  account: {
    id: string;
    balance: number;
    credit_balance: number;
    collections_status: string;
    autopay_enabled: boolean;
    sibling_discount_percent: number;
  } | null;
  guardians: {
    id: string;
    first_name: string;
    last_name: string;
    receives_billing: boolean;
    email: string | null;
    phone?: string | null;
    financial_responsibility_percent?: number | null;
  }[];
  payers: { id: string; payer_name: string; responsibility_percent: number; is_primary: boolean; custody_basis: string | null }[];
  paymentMethods: { id: string; method_type: string; last_four: string | null; is_default: boolean }[];
  autopay: { id: string; status: string; day_of_month: number | null }[];
  paymentPlans: { id: string; name: string; total_amount: number; installment_amount: number; status: string }[];
  credits: { id: string; amount: number; remaining_amount: number; reason: string | null }[];
  invoices: { id: string; invoice_number: string; total_amount: number; amount_paid: number; invoice_status: string; due_date: string; family_responsibility?: number }[];
  students: { id: string; first_name: string; last_name: string; program: string | null }[];
  payments?: {
    id: string;
    amount: number;
    payment_method: string;
    receipt_number: string | null;
    paid_at: string | null;
    invoices?: { invoice_number: string } | { invoice_number: string }[];
  }[];
  scholarships?: {
    id: string;
    approved_amount: number | null;
    remaining_award_balance: number | null;
    scholarship_type: string | null;
    renewal_date: string | null;
    expires_on: string | null;
    conditions: string | null;
    students?: StudentRef;
  }[];
  stateFunding?: {
    id: string;
    funding_category: string;
    program_name: string | null;
    award_amount: number | null;
    verification_status: string;
    payment_status: string;
    renewal_date: string | null;
    state_code: string | null;
    students?: StudentRef;
  }[];
  adjustments?: {
    id: string;
    adjustment_type: string;
    amount: number;
    reason: string;
    created_at: string;
  }[];
}

export interface FamilyFinancialCenterProps {
  familyId: string;
  profile: FamilyFinancialProfile;
  portalMode?: boolean;
}
