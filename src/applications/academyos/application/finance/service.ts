import type {
  ApplyPaymentCommand,
  CreateInvoiceCommand,
  CreateScholarshipCommand,
  InvoiceDto,
  PaymentDto,
  ScholarshipDto,
} from "@/applications/academyos/application/dto";
import {
  appFail,
  appOk,
  fromDomain,
  hasPermission,
  requirePermission,
  type ApplicationContext,
  type ApplicationResult,
} from "@/applications/academyos/application/shared";
import { FinanceDomainService } from "@/applications/academyos/domain/finance/service";
import type { FinanceRepository } from "@/applications/academyos/domain/repositories";
import { EntityPlatformAdapter } from "@/applications/academyos/platform-adapters";
import { FinanceWorkflowAdapter } from "@/applications/academyos/workflow-adapters";

export type FinanceApplicationServiceDeps = {
  financeRepo: FinanceRepository;
  workflows?: typeof FinanceWorkflowAdapter;
  entities?: typeof EntityPlatformAdapter;
};

export type EstimateScholarshipCommand = {
  householdIncome: number;
  familySize: number;
  siblingCount: number;
  specialCircumstanceScore: number;
};

export type FinanceApplicationService = {
  createInvoice(
    ctx: ApplicationContext,
    command: CreateInvoiceCommand
  ): Promise<ApplicationResult<InvoiceDto>>;
  applyPayment(
    ctx: ApplicationContext,
    command: ApplyPaymentCommand
  ): Promise<ApplicationResult<{ invoice: InvoiceDto; payment: PaymentDto }>>;
  createScholarship(
    ctx: ApplicationContext,
    command: CreateScholarshipCommand
  ): Promise<ApplicationResult<ScholarshipDto>>;
  outstandingForStudent(
    ctx: ApplicationContext,
    studentId: string
  ): Promise<ApplicationResult<{ studentId: string; outstanding: number }>>;
  estimateScholarshipAward(
    ctx: ApplicationContext,
    command: EstimateScholarshipCommand
  ): Promise<ApplicationResult<{ approvedAmount: number }>>;
};

function toInvoice(row: {
  id: string;
  displayName: string;
  studentId?: string | null;
  familyId?: string | null;
  amount: number;
  dueDate?: string | null;
  status: string;
}): InvoiceDto {
  return {
    id: row.id,
    displayName: row.displayName,
    studentId: row.studentId ?? null,
    familyId: row.familyId ?? null,
    amount: row.amount,
    dueDate: row.dueDate ?? null,
    status: row.status,
  };
}

export function createFinanceApplicationService(
  deps: FinanceApplicationServiceDeps
): FinanceApplicationService {
  const workflows = deps.workflows ?? FinanceWorkflowAdapter;
  const entities = deps.entities ?? EntityPlatformAdapter;

  return {
    async createInvoice(ctx, command) {
      const gate = requirePermission(ctx, "academyos.finance.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = FinanceDomainService.createInvoice(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.financeRepo.saveInvoice(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Invoice",
        displayName: saved.displayName,
        status: "pending",
        organizationId: ctx.organizationId,
        metadata: { amount: saved.amount, status: saved.status },
      });
      workflows.startBilling({
        invoiceId: saved.id,
        actorUserId: ctx.actorUserId,
        organizationId: ctx.organizationId,
        grantedPermissions: ctx.permissions,
      });

      return appOk(toInvoice(saved));
    },

    async applyPayment(ctx, command) {
      const gate = requirePermission(ctx, "academyos.finance.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const invoice = await deps.financeRepo.getInvoice(command.invoiceId);
      if (!invoice) {
        return appFail({
          code: "not_found",
          message: "Invoice not found",
          path: "invoiceId",
        });
      }

      const applied = FinanceDomainService.applyPayment(invoice, command);
      if (!applied.ok) return fromDomain(applied);

      const savedInvoice = await deps.financeRepo.saveInvoice(
        applied.value.invoice
      );
      const savedPayment = await deps.financeRepo.savePayment(
        applied.value.payment
      );

      return appOk({
        invoice: toInvoice(savedInvoice),
        payment: {
          id: savedPayment.id,
          displayName: savedPayment.displayName,
          invoiceId: savedPayment.invoiceId ?? null,
          amount: savedPayment.amount,
          paidOn: savedPayment.paidOn,
          method: savedPayment.method ?? null,
          status: savedPayment.status,
        },
      });
    },

    async createScholarship(ctx, command) {
      const gate = requirePermission(ctx, "academyos.scholarships.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = FinanceDomainService.createScholarship(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.financeRepo.saveScholarship(drafted.value);
      workflows.startScholarship({
        scholarshipId: saved.id,
        actorUserId: ctx.actorUserId,
        organizationId: ctx.organizationId,
        grantedPermissions: ctx.permissions,
      });

      return appOk({
        id: saved.id,
        displayName: saved.displayName,
        studentId: saved.studentId,
        awardAmount: saved.awardAmount,
        status: saved.status,
        awardedOn: saved.awardedOn ?? null,
      });
    },

    async outstandingForStudent(ctx, studentId) {
      const gate = requirePermission(ctx, "academyos.finance.read");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const invoices = await deps.financeRepo.listOpenInvoicesByStudent(studentId);
      return appOk({
        studentId,
        outstanding: FinanceDomainService.outstandingTuition(invoices),
      });
    },

    async estimateScholarshipAward(ctx, command) {
      const allowed =
        hasPermission(ctx, "academyos.scholarships.create") ||
        hasPermission(ctx, "academyos.scholarships.approve") ||
        hasPermission(ctx, "scholarships.approve");
      if (!allowed) {
        return appFail({
          code: "forbidden",
          message: "Missing permission: scholarships.approve",
        });
      }

      return appOk({
        approvedAmount: FinanceDomainService.estimateScholarshipAward(command),
      });
    },
  };
}
