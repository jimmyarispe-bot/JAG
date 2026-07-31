import type {
  FinanceRepository,
  InvoiceRecord,
  PaymentRecord,
  ScholarshipRecord,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  InvoiceMapper,
  PaymentMapper,
  ScholarshipMapper,
} from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseFinanceRepository implements FinanceRepository {
  constructor(private readonly db: DatabaseProvider) {}

  async getInvoice(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.invoices).findById(id);
    return row ? InvoiceMapper.rowToDomain(row) : null;
  }

  async saveInvoice(record: InvoiceRecord) {
    return InvoiceMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.invoices)
        .upsert(InvoiceMapper.domainToRow(record))
    );
  }

  async getPayment(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.payments).findById(id);
    return row ? PaymentMapper.rowToDomain(row) : null;
  }

  async savePayment(record: PaymentRecord) {
    return PaymentMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.payments)
        .upsert(PaymentMapper.domainToRow(record))
    );
  }

  async getScholarship(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.scholarships).findById(id);
    return row ? ScholarshipMapper.rowToDomain(row) : null;
  }

  async saveScholarship(record: ScholarshipRecord) {
    return ScholarshipMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.scholarships)
        .upsert(ScholarshipMapper.domainToRow(record))
    );
  }

  async listOpenInvoicesByStudent(studentId: string) {
    const rows = await this.db
      .from(ACADEMYOS_TABLES.invoices)
      .findMany({ student_id: studentId });
    return rows
      .map((row) => InvoiceMapper.rowToDomain(row))
      .filter((r) => !["closed", "cancelled"].includes(r.status));
  }
}
