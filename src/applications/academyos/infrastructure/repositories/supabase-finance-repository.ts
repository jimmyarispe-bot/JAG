import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  pickNullableString,
  pickString,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  FinanceRepository,
  InvoiceRecord,
  PaymentRecord,
  ScholarshipRecord,
} from "@/applications/academyos/domain/repositories";

function invoiceToRow(record: InvoiceRecord) {
  return {
    id: record.id,
    display_name: record.displayName,
    student_id: record.studentId ?? null,
    family_id: record.familyId ?? null,
    amount: record.amount,
    due_date: record.dueDate ?? null,
    status: record.status,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function invoiceFromRow(row: Record<string, unknown>): InvoiceRecord {
  return {
    id: pickString(row, "id"),
    displayName: pickString(row, "display_name"),
    studentId: pickNullableString(row, "student_id"),
    familyId: pickNullableString(row, "family_id"),
    amount: Number(row.amount ?? 0),
    dueDate: pickNullableString(row, "due_date"),
    status: pickString(row, "status"),
    createdAt: pickString(row, "created_at"),
    updatedAt: pickString(row, "updated_at"),
  };
}

function paymentToRow(record: PaymentRecord) {
  return {
    id: record.id,
    display_name: record.displayName,
    invoice_id: record.invoiceId ?? null,
    amount: record.amount,
    paid_on: record.paidOn,
    method: record.method ?? null,
    status: record.status,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function paymentFromRow(row: Record<string, unknown>): PaymentRecord {
  return {
    id: pickString(row, "id"),
    displayName: pickString(row, "display_name"),
    invoiceId: pickNullableString(row, "invoice_id"),
    amount: Number(row.amount ?? 0),
    paidOn: pickString(row, "paid_on"),
    method: pickNullableString(row, "method"),
    status: pickString(row, "status"),
    createdAt: pickString(row, "created_at"),
    updatedAt: pickString(row, "updated_at"),
  };
}

function scholarshipToRow(record: ScholarshipRecord) {
  return {
    id: record.id,
    display_name: record.displayName,
    student_id: record.studentId,
    award_amount: record.awardAmount,
    status: record.status,
    awarded_on: record.awardedOn ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function scholarshipFromRow(row: Record<string, unknown>): ScholarshipRecord {
  return {
    id: pickString(row, "id"),
    displayName: pickString(row, "display_name"),
    studentId: pickString(row, "student_id"),
    awardAmount: Number(row.award_amount ?? 0),
    status: pickString(row, "status"),
    awardedOn: pickNullableString(row, "awarded_on"),
    createdAt: pickString(row, "created_at"),
    updatedAt: pickString(row, "updated_at"),
  };
}

export function createSupabaseFinanceRepository(
  db: DatabaseProvider
): FinanceRepository {
  const invoices = db.from(ACADEMYOS_TABLES.invoices);
  const payments = db.from(ACADEMYOS_TABLES.payments);
  const scholarships = db.from(ACADEMYOS_TABLES.scholarships);

  return {
    getInvoice: async (id) => {
      const row = await invoices.findById(id);
      return row ? invoiceFromRow(row) : null;
    },
    saveInvoice: async (record) =>
      invoiceFromRow(await invoices.upsert(invoiceToRow(record))),
    getPayment: async (id) => {
      const row = await payments.findById(id);
      return row ? paymentFromRow(row) : null;
    },
    savePayment: async (record) =>
      paymentFromRow(await payments.upsert(paymentToRow(record))),
    getScholarship: async (id) => {
      const row = await scholarships.findById(id);
      return row ? scholarshipFromRow(row) : null;
    },
    saveScholarship: async (record) =>
      scholarshipFromRow(await scholarships.upsert(scholarshipToRow(record))),
    listOpenInvoicesByStudent: async (studentId) => {
      const rows = await invoices.findMany({ student_id: studentId });
      return rows
        .map(invoiceFromRow)
        .filter((r) => !["closed", "cancelled"].includes(r.status));
    },
  };
}
