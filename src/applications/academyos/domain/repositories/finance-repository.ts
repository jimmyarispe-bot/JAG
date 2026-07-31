export type InvoiceRecord = {
  id: string;
  displayName: string;
  studentId?: string | null;
  familyId?: string | null;
  amount: number;
  dueDate?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentRecord = {
  id: string;
  displayName: string;
  invoiceId?: string | null;
  amount: number;
  paidOn: string;
  method?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ScholarshipRecord = {
  id: string;
  displayName: string;
  studentId: string;
  awardAmount: number;
  status: string;
  awardedOn?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceRepository = {
  getInvoice(id: string): Promise<InvoiceRecord | null>;
  saveInvoice(record: InvoiceRecord): Promise<InvoiceRecord>;
  getPayment(id: string): Promise<PaymentRecord | null>;
  savePayment(record: PaymentRecord): Promise<PaymentRecord>;
  getScholarship(id: string): Promise<ScholarshipRecord | null>;
  saveScholarship(record: ScholarshipRecord): Promise<ScholarshipRecord>;
  listOpenInvoicesByStudent(studentId: string): Promise<InvoiceRecord[]>;
};
