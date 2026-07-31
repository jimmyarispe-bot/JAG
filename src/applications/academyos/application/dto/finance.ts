export type InvoiceDto = {
  id: string;
  displayName: string;
  studentId: string | null;
  familyId: string | null;
  amount: number;
  dueDate: string | null;
  status: string;
};

export type PaymentDto = {
  id: string;
  displayName: string;
  invoiceId: string | null;
  amount: number;
  paidOn: string;
  method: string | null;
  status: string;
};

export type ScholarshipDto = {
  id: string;
  displayName: string;
  studentId: string;
  awardAmount: number;
  status: string;
  awardedOn: string | null;
};

export type CreateInvoiceCommand = {
  displayName: string;
  amount: number;
  studentId?: string | null;
  familyId?: string | null;
  dueDate?: string | null;
};

export type ApplyPaymentCommand = {
  invoiceId: string;
  displayName: string;
  amount: number;
  paidOn: string;
  method?: string | null;
};

export type CreateScholarshipCommand = {
  displayName: string;
  studentId: string;
  awardAmount: number;
};
