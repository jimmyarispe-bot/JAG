import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { WorkflowActionType, WorkflowEventContext, WorkflowNode } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ActionExecutionResult {
  ok: boolean;
  actionType: WorkflowActionType | string;
  message: string;
  output?: Record<string, unknown>;
  deferred?: boolean;
}

export const WORKFLOW_ACTION_LIBRARY: Array<{
  type: WorkflowActionType;
  label: string;
  description: string;
}> = [
  { type: "send_email", label: "Send Email", description: "Queue an email communication" },
  { type: "send_sms", label: "Send SMS", description: "Queue an SMS (provider deferred)" },
  {
    type: "portal_notification",
    label: "Portal Notification",
    description: "Create an in-app / portal notification",
  },
  { type: "create_task", label: "Create Task", description: "Create a follow-up task" },
  { type: "update_student", label: "Update Student", description: "Patch student fields" },
  { type: "update_family", label: "Update Family", description: "Patch family fields" },
  { type: "assign_employee", label: "Assign Employee", description: "Assign staff to entity" },
  { type: "schedule_meeting", label: "Schedule Meeting", description: "Log / schedule a meeting" },
  {
    type: "create_calendar_event",
    label: "Create Calendar Event",
    description: "Create a calendar event via the Calendar platform",
  },
  {
    type: "cancel_calendar_event",
    label: "Cancel Calendar Event",
    description: "Cancel a calendar event by id",
  },
  {
    type: "reschedule_calendar_event",
    label: "Reschedule Calendar Event",
    description: "Update start/end of a calendar event",
  },
  {
    type: "generate_invoice",
    label: "Generate Invoice",
    description: "Generate a tuition invoice from a plan",
  },
  {
    type: "apply_scholarship",
    label: "Apply Scholarship",
    description: "Apply a scholarship award to an invoice",
  },
  {
    type: "send_billing_reminder",
    label: "Send Billing Reminder",
    description: "Queue an overdue / payment reminder via Communications",
  },
  {
    type: "mark_invoice_paid",
    label: "Mark Invoice Paid",
    description: "Mark an invoice as paid (manual settlement)",
  },
  {
    type: "issue_refund_request",
    label: "Issue Refund Request",
    description: "Create a refund request in the refund queue",
  },
  {
    type: "escalate_overdue_account",
    label: "Escalate Overdue Account",
    description: "Mark invoice overdue and notify staff",
  },
  {
    type: "transition_employee_lifecycle",
    label: "Transition Employee Lifecycle",
    description: "Move an employee to a new HCM lifecycle state",
  },
  {
    type: "approve_leave_request",
    label: "Approve Leave Request",
    description: "Approve a pending time-off / leave request",
  },
  {
    type: "start_employee_onboarding",
    label: "Start Employee Onboarding",
    description: "Seed extended onboarding tasks for an employee",
  },
  {
    type: "send_hcm_reminder",
    label: "Send HCM Reminder",
    description: "Queue an HR / HCM communication (offer, certs, leave, etc.)",
  },
  {
    type: "emit_certification_alerts",
    label: "Emit Certification Alerts",
    description: "Emit EI + communications for expiring credentials",
  },
  {
    type: "open_founder_investigation",
    label: "Open Founder Investigation",
    description: "Open an investigation task from an approved Founder decision",
  },
  {
    type: "schedule_founder_review",
    label: "Schedule Founder Review",
    description: "Schedule a review meeting for a Founder recommendation",
  },
  {
    type: "generate_founder_report",
    label: "Generate Founder Report",
    description: "Queue a Founder Intelligence summary report",
  },
  {
    type: "generate_document",
    label: "Generate Document",
    description: "Generate a document from a template",
  },
  {
    type: "create_document",
    label: "Create Document",
    description: "Create a platform document record",
  },
  {
    type: "request_document_upload",
    label: "Request Document Upload",
    description: "Request an upload (portal notification + draft document)",
  },
  {
    type: "approve_document",
    label: "Approve Document",
    description: "Approve a document in review",
  },
  {
    type: "reject_document",
    label: "Reject Document",
    description: "Reject a document in review",
  },
  {
    type: "archive_document",
    label: "Archive Document",
    description: "Archive a platform document",
  },
  {
    type: "route_document_for_review",
    label: "Route Document for Review",
    description: "Mark a document pending review",
  },
  {
    type: "add_timeline_event",
    label: "Add Timeline Event",
    description: "Append a timeline / activity note",
  },
  {
    type: "publish_executive_event",
    label: "Publish Executive Event",
    description: "Emit an Executive Intelligence event",
  },
  { type: "wait", label: "Wait", description: "Delay before continuing (recorded)" },
  { type: "branch", label: "Branch", description: "Conditional branch (graph edge)" },
  {
    type: "call_provider_adapter",
    label: "Call Provider Adapter",
    description: "Invoke an extension / provider adapter",
  },
];

/**
 * Execute a single workflow action node.
 * External providers are deferred; core AcademyOS side-effects are best-effort.
 */
export async function executeWorkflowAction(
  supabase: AuthClient,
  node: WorkflowNode,
  ctx: WorkflowEventContext
): Promise<ActionExecutionResult> {
  const actionType = String(node.config.actionType ?? node.config.type ?? "add_timeline_event");
  const config = node.config;

  try {
    switch (actionType as WorkflowActionType) {
      case "send_email":
      case "send_sms": {
        const { data, error } = await supabase
          .from("platform_communications")
          .insert({
            organization_id: ctx.organizationId ?? null,
            school_id: ctx.schoolId ?? null,
            type: actionType === "send_sms" ? "sms" : "email",
            direction: "outbound",
            status: "queued",
            subject: String(config.subject ?? node.label),
            body_text: String(config.body ?? config.bodyText ?? ""),
            student_id: ctx.studentId ?? null,
            family_id: ctx.familyId ?? null,
            sender_user_id: ctx.actorUserId ?? null,
            metadata: { workflowAction: actionType, triggerKey: ctx.triggerKey },
          })
          .select("id")
          .single();
        if (error) {
          return {
            ok: false,
            actionType,
            message: error.message,
          };
        }
        return {
          ok: true,
          actionType,
          message: `${actionType} queued`,
          output: { communicationId: data?.id },
          deferred: actionType === "send_sms",
        };
      }

      case "portal_notification": {
        if (!ctx.actorUserId && !config.userId) {
          return {
            ok: true,
            actionType,
            message: "Portal notification skipped (no target user)",
            deferred: true,
          };
        }
        const userId = String(config.userId ?? ctx.actorUserId);
        const { data, error } = await supabase
          .from("platform_in_app_notifications")
          .insert({
            user_id: userId,
            title: String(config.title ?? node.label),
            body: String(config.body ?? ""),
            category: String(config.category ?? "workflow"),
            href: (config.href as string) ?? "/dashboard/workflows",
            related_student_id: ctx.studentId ?? null,
            related_family_id: ctx.familyId ?? null,
          })
          .select("id")
          .single();
        if (error) return { ok: false, actionType, message: error.message };
        return {
          ok: true,
          actionType,
          message: "Portal notification created",
          output: { notificationId: data?.id },
        };
      }

      case "create_task": {
        try {
          const { createMissionControlItem } = await import(
            "@/lib/platform/automation/mission-control"
          );
          await createMissionControlItem(supabase, {
            schoolId: ctx.schoolId ?? undefined,
            module: "mission_control",
            itemType: "pending_task",
            title: String(config.title ?? node.label),
            body: String(config.body ?? config.description ?? ""),
            entityType: ctx.entityType ?? undefined,
            entityId: ctx.entityId ?? undefined,
            href: "/dashboard/workflows",
            metadata: { triggerKey: ctx.triggerKey, source: "workflow_engine" },
          });
          return {
            ok: true,
            actionType,
            message: "Task / Mission Control item created",
          };
        } catch {
          return {
            ok: true,
            actionType,
            message: "Task recorded (Mission Control unavailable)",
            deferred: true,
          };
        }
      }

      case "update_student": {
        if (!ctx.studentId) {
          return { ok: false, actionType, message: "No studentId in context" };
        }
        const patch = (config.patch as Record<string, unknown>) ?? {};
        if (!Object.keys(patch).length) {
          return { ok: true, actionType, message: "No student fields to update", deferred: true };
        }
        const { error } = await supabase.from("students").update(patch).eq("id", ctx.studentId);
        if (error) return { ok: false, actionType, message: error.message };
        return { ok: true, actionType, message: "Student updated", output: { patch } };
      }

      case "update_family": {
        if (!ctx.familyId) {
          return { ok: false, actionType, message: "No familyId in context" };
        }
        const patch = (config.patch as Record<string, unknown>) ?? {};
        if (!Object.keys(patch).length) {
          return { ok: true, actionType, message: "No family fields to update", deferred: true };
        }
        const { error } = await supabase.from("families").update(patch).eq("id", ctx.familyId);
        if (error) return { ok: false, actionType, message: error.message };
        return { ok: true, actionType, message: "Family updated", output: { patch } };
      }

      case "create_calendar_event": {
        const { createCalendarEvent } = await import("@/lib/calendar/service");
        const startsAt =
          String(config.startsAt ?? config.starts_at ?? "") ||
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const endsAt =
          String(config.endsAt ?? config.ends_at ?? "") ||
          new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
        const result = await createCalendarEvent(supabase, {
          title: String(config.title ?? node.label ?? "Workflow event"),
          description: String(config.body ?? config.description ?? "Created by workflow"),
          eventType: (config.eventType as "meeting" | "reminder" | "workflow_scheduled") ??
            "workflow_scheduled",
          startsAt,
          endsAt,
          schoolId: ctx.schoolId,
          organizationId: ctx.organizationId,
          studentIds: ctx.studentId ? [ctx.studentId] : [],
          familyId: ctx.familyId,
          recurrenceRule: (config.recurrenceRule as string) ?? null,
          skipConflictCheck: Boolean(config.skipConflictCheck),
          metadata: { workflowTrigger: ctx.triggerKey },
        });
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return {
          ok: true,
          actionType,
          message: "Calendar event created",
          output: { eventId: result.eventId, auditId: result.auditId },
        };
      }

      case "cancel_calendar_event": {
        const eventId = String(config.eventId ?? config.calendarEventId ?? "");
        if (!eventId) {
          return { ok: false, actionType, message: "eventId required" };
        }
        const { cancelCalendarEvent } = await import("@/lib/calendar/service");
        const result = await cancelCalendarEvent(supabase, eventId);
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return { ok: true, actionType, message: "Calendar event cancelled", output: { eventId } };
      }

      case "reschedule_calendar_event": {
        const eventId = String(config.eventId ?? config.calendarEventId ?? "");
        if (!eventId || !config.startsAt || !config.endsAt) {
          return { ok: false, actionType, message: "eventId, startsAt, endsAt required" };
        }
        const { updateCalendarEvent } = await import("@/lib/calendar/service");
        const result = await updateCalendarEvent(supabase, eventId, {
          startsAt: String(config.startsAt),
          endsAt: String(config.endsAt),
          skipConflictCheck: Boolean(config.skipConflictCheck),
        });
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return { ok: true, actionType, message: "Calendar event rescheduled", output: { eventId } };
      }

      case "generate_document":
      case "create_document": {
        const { createDocument } = await import("@/lib/documents/service");
        const { duplicateFromTemplate } = await import("@/lib/documents/templates");
        const templateId = String(config.templateId ?? config.template_id ?? "");
        const title = String(config.title ?? node.label ?? "Workflow document");
        const relations = [
          ...(ctx.studentId
            ? [{ entityType: "student" as const, entityId: ctx.studentId, isPrimary: true }]
            : []),
          ...(ctx.familyId
            ? [{ entityType: "family" as const, entityId: ctx.familyId, isPrimary: true }]
            : []),
        ];
        const result = templateId
          ? await duplicateFromTemplate(supabase, templateId, {
              title,
              schoolId: ctx.schoolId,
              organizationId: ctx.organizationId,
              workflowId: ctx.entityId ?? null,
              relations,
              status: "draft",
            })
          : await createDocument(supabase, {
              title,
              description: String(config.body ?? config.description ?? "Created by workflow"),
              category: (config.category as "other") ?? "other",
              schoolId: ctx.schoolId,
              organizationId: ctx.organizationId,
              workflowId: ctx.entityId ?? null,
              relations,
              status: actionType === "generate_document" ? "draft" : "active",
              metadata: { workflowTrigger: ctx.triggerKey },
            });
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return {
          ok: true,
          actionType,
          message: "Document created",
          output: {
            documentId: result.documentId,
            auditId: result.auditId,
            version: result.version,
          },
        };
      }

      case "request_document_upload": {
        const { createDocument } = await import("@/lib/documents/service");
        const title = String(config.title ?? node.label ?? "Upload requested");
        const docResult = await createDocument(supabase, {
          title,
          description: String(config.body ?? "Please upload the requested document."),
          category: (config.category as "other") ?? "other",
          schoolId: ctx.schoolId,
          organizationId: ctx.organizationId,
          workflowId: ctx.entityId ?? null,
          status: "draft",
          relations: [
            ...(ctx.studentId
              ? [{ entityType: "student" as const, entityId: ctx.studentId, isPrimary: true }]
              : []),
            ...(ctx.familyId
              ? [{ entityType: "family" as const, entityId: ctx.familyId, isPrimary: true }]
              : []),
          ],
          metadata: { uploadRequested: true, workflowTrigger: ctx.triggerKey },
        });
        if (!docResult.ok) return { ok: false, actionType, message: docResult.error };

        if (ctx.actorUserId || config.userId) {
          const userId = String(config.userId ?? ctx.actorUserId);
          await supabase.from("platform_in_app_notifications").insert({
            user_id: userId,
            title: "Document upload requested",
            body: title,
            category: "documents",
            href: "/dashboard/documents",
            related_student_id: ctx.studentId ?? null,
            related_family_id: ctx.familyId ?? null,
          });
        }
        return {
          ok: true,
          actionType,
          message: "Document upload requested",
          output: { documentId: docResult.documentId, auditId: docResult.auditId },
        };
      }

      case "approve_document": {
        const documentId = String(config.documentId ?? ctx.entityId ?? "");
        if (!documentId) return { ok: false, actionType, message: "documentId required" };
        const { approveDocument } = await import("@/lib/documents/service");
        const result = await approveDocument(supabase, documentId);
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return { ok: true, actionType, message: "Document approved", output: { documentId } };
      }

      case "reject_document": {
        const documentId = String(config.documentId ?? ctx.entityId ?? "");
        if (!documentId) return { ok: false, actionType, message: "documentId required" };
        const { rejectDocument } = await import("@/lib/documents/service");
        const result = await rejectDocument(
          supabase,
          documentId,
          String(config.reason ?? config.body ?? "")
        );
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return { ok: true, actionType, message: "Document rejected", output: { documentId } };
      }

      case "archive_document": {
        const documentId = String(config.documentId ?? ctx.entityId ?? "");
        if (!documentId) return { ok: false, actionType, message: "documentId required" };
        const { archiveDocument } = await import("@/lib/documents/service");
        const result = await archiveDocument(supabase, documentId);
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return { ok: true, actionType, message: "Document archived", output: { documentId } };
      }

      case "route_document_for_review": {
        const documentId = String(config.documentId ?? ctx.entityId ?? "");
        if (!documentId) return { ok: false, actionType, message: "documentId required" };
        const { routeDocumentForReview } = await import("@/lib/documents/service");
        const result = await routeDocumentForReview(supabase, documentId);
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return {
          ok: true,
          actionType,
          message: "Document routed for review",
          output: { documentId },
        };
      }

      case "generate_invoice": {
        const { generateTuitionInvoiceFromPlan } = await import("@/lib/finance/tuition-engine");
        const billingAccountId = String(config.billingAccountId ?? "");
        const studentId = String(config.studentId ?? ctx.studentId ?? "");
        const tuitionPlanId = String(config.tuitionPlanId ?? "");
        if (!billingAccountId || !studentId || !tuitionPlanId) {
          return {
            ok: false,
            actionType,
            message: "billingAccountId, studentId, tuitionPlanId required",
          };
        }
        try {
          const generated = await generateTuitionInvoiceFromPlan(supabase, {
            billingAccountId,
            studentId,
            tuitionPlanId,
            invoiceNumber:
              String(config.invoiceNumber ?? "") || `WF-${Date.now().toString().slice(-8)}`,
            dueDate:
              String(config.dueDate ?? "") ||
              new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
            description: String(config.description ?? node.label ?? "Workflow invoice"),
          });
          return {
            ok: true,
            actionType,
            message: "Invoice generated",
            output: { invoiceId: generated.invoiceId },
          };
        } catch (error) {
          return {
            ok: false,
            actionType,
            message: error instanceof Error ? error.message : String(error),
          };
        }
      }

      case "apply_scholarship": {
        const { applyScholarshipToInvoice } = await import("@/lib/finance-platform/scholarships");
        const result = await applyScholarshipToInvoice(supabase, {
          scholarshipApplicationId: String(config.scholarshipApplicationId ?? ""),
          invoiceId: String(config.invoiceId ?? ctx.entityId ?? ""),
          amount: config.amount != null ? Number(config.amount) : undefined,
        });
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return {
          ok: true,
          actionType,
          message: "Scholarship applied",
          output: { appliedAmount: result.appliedAmount, remaining: result.remainingBalance },
        };
      }

      case "send_billing_reminder": {
        const { sendFinanceCommunication } = await import(
          "@/lib/finance-platform/communications"
        );
        const result = await sendFinanceCommunication(supabase, {
          kind: (config.kind as "payment_overdue" | "payment_plan_reminder") ?? "payment_overdue",
          organizationId: ctx.organizationId,
          schoolId: ctx.schoolId,
          familyId: ctx.familyId,
          studentId: ctx.studentId,
          body: String(config.body ?? config.description ?? ""),
          actorUserId: ctx.actorUserId,
        });
        return {
          ok: result.ok,
          actionType,
          message: result.ok ? "Billing reminder queued" : result.error ?? "Reminder failed",
          deferred: result.deferred,
          output: { communicationId: result.communicationId },
        };
      }

      case "mark_invoice_paid": {
        const invoiceId = String(config.invoiceId ?? ctx.entityId ?? "");
        if (!invoiceId) return { ok: false, actionType, message: "invoiceId required" };
        const { data: invoice } = await supabase
          .from("invoices")
          .select("total_amount, amount_paid")
          .eq("id", invoiceId)
          .maybeSingle();
        if (!invoice) return { ok: false, actionType, message: "Invoice not found" };
        await supabase
          .from("invoices")
          .update({
            amount_paid: Number(invoice.total_amount),
            invoice_status: "paid",
            paid_at: new Date().toISOString().slice(0, 10),
          })
          .eq("id", invoiceId);
        const { recordFinanceActivity } = await import("@/lib/finance-platform/activity");
        await recordFinanceActivity(supabase, {
          eventType: "invoice.paid",
          title: "Invoice marked paid",
          entityId: invoiceId,
          organizationId: ctx.organizationId,
          schoolId: ctx.schoolId,
          familyId: ctx.familyId,
          studentId: ctx.studentId,
          actorUserId: ctx.actorUserId,
        });
        return { ok: true, actionType, message: "Invoice marked paid", output: { invoiceId } };
      }

      case "issue_refund_request": {
        const { createRefundRequest } = await import("@/lib/finance-platform/refunds");
        const billingAccountId = String(config.billingAccountId ?? "");
        if (!billingAccountId) {
          return { ok: false, actionType, message: "billingAccountId required" };
        }
        const result = await createRefundRequest(supabase, {
          billingAccountId,
          amount: Number(config.amount ?? 0),
          reason: String(config.reason ?? config.body ?? "Workflow refund request"),
          invoiceId: String(config.invoiceId ?? ctx.entityId ?? "") || null,
          familyId: ctx.familyId,
          studentId: ctx.studentId,
          schoolId: ctx.schoolId,
          organizationId: ctx.organizationId,
        });
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return {
          ok: true,
          actionType,
          message: "Refund request created",
          output: { refundId: result.refundId },
        };
      }

      case "escalate_overdue_account": {
        const invoiceId = String(config.invoiceId ?? ctx.entityId ?? "");
        if (!invoiceId) return { ok: false, actionType, message: "invoiceId required" };
        const { markInvoiceOverdue } = await import("@/lib/finance-platform/invoices");
        const result = await markInvoiceOverdue(supabase, invoiceId);
        if (!result.ok) return { ok: false, actionType, message: result.error };
        const { sendFinanceCommunication } = await import(
          "@/lib/finance-platform/communications"
        );
        await sendFinanceCommunication(supabase, {
          kind: "payment_overdue",
          organizationId: ctx.organizationId,
          schoolId: ctx.schoolId,
          familyId: ctx.familyId,
          studentId: ctx.studentId,
          actorUserId: ctx.actorUserId,
        });
        return {
          ok: true,
          actionType,
          message: "Overdue account escalated",
          output: { invoiceId },
        };
      }

      case "transition_employee_lifecycle": {
        const { transitionEmployeeLifecycle } = await import("@/lib/hr-platform/lifecycle");
        const employeeId = String(config.employeeId ?? ctx.entityId ?? "");
        const toState = String(config.toState ?? "");
        if (!employeeId || !toState) {
          return { ok: false, actionType, message: "employeeId and toState required" };
        }
        const result = await transitionEmployeeLifecycle(supabase, {
          employeeId,
          toState: toState as import("@/lib/hr-platform/types").EmployeeLifecycleState,
          title: String(config.title ?? node.label ?? ""),
          notes: String(config.notes ?? "") || undefined,
          schoolId: ctx.schoolId,
          organizationId: ctx.organizationId,
        });
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return {
          ok: true,
          actionType,
          message: `Lifecycle → ${result.toState}`,
          output: { employeeId, fromState: result.fromState, toState: result.toState },
        };
      }

      case "approve_leave_request": {
        const { decideLeaveRequest } = await import("@/lib/hr-platform/leave");
        const leaveId = String(config.leaveId ?? ctx.entityId ?? "");
        if (!leaveId) return { ok: false, actionType, message: "leaveId required" };
        const result = await decideLeaveRequest(supabase, {
          leaveId,
          decision: "approved",
          setLeaveOfAbsence: Boolean(config.setLeaveOfAbsence),
        });
        if (!result.ok) return { ok: false, actionType, message: result.error };
        return {
          ok: true,
          actionType,
          message: "Leave request approved",
          output: { leaveId: result.leaveId },
        };
      }

      case "start_employee_onboarding": {
        const { ensureExtendedOnboardingTasks } = await import("@/lib/hr-platform/onboarding");
        const { transitionEmployeeLifecycle } = await import("@/lib/hr-platform/lifecycle");
        const employeeId = String(config.employeeId ?? ctx.entityId ?? "");
        if (!employeeId) return { ok: false, actionType, message: "employeeId required" };
        await ensureExtendedOnboardingTasks(supabase, employeeId);
        await transitionEmployeeLifecycle(supabase, {
          employeeId,
          toState: "onboarding",
          title: String(config.title ?? "Onboarding started"),
          schoolId: ctx.schoolId,
          organizationId: ctx.organizationId,
        });
        return {
          ok: true,
          actionType,
          message: "Onboarding started",
          output: { employeeId },
        };
      }

      case "send_hcm_reminder": {
        const { sendHcmCommunication } = await import("@/lib/hr-platform/communications");
        const result = await sendHcmCommunication(supabase, {
          kind:
            (config.kind as
              | "offer_letter"
              | "onboarding_reminder"
              | "certification_alert"
              | "review_reminder"
              | "contract_renewal"
              | "time_off_decision") ?? "onboarding_reminder",
          organizationId: ctx.organizationId,
          schoolId: ctx.schoolId,
          body: String(config.body ?? config.description ?? ""),
          actorUserId: ctx.actorUserId,
        });
        return {
          ok: result.ok,
          actionType,
          message: result.ok ? "HCM reminder queued" : result.error ?? "Reminder failed",
          output: { communicationId: result.communicationId },
        };
      }

      case "emit_certification_alerts": {
        const { emitCertificationExpiringAlerts } = await import(
          "@/lib/hr-platform/certifications"
        );
        const count = await emitCertificationExpiringAlerts(supabase, {
          schoolId: ctx.schoolId,
          withinDays: Number(config.withinDays ?? 90),
        });
        return {
          ok: true,
          actionType,
          message: `Emitted ${count} certification alert(s)`,
          output: { count },
        };
      }

      case "open_founder_investigation":
      case "schedule_founder_review":
      case "generate_founder_report": {
        // Only meaningful after explicit Founder approval (caller / trigger gate)
        await supabase.from("platform_communications").insert({
          organization_id: ctx.organizationId ?? null,
          school_id: ctx.schoolId ?? null,
          type: "email",
          direction: "outbound",
          status: "queued",
          subject: String(config.subject ?? node.label ?? actionType),
          body_text: String(
            config.body ??
              `Founder workflow action ${actionType} for ${ctx.entityId ?? "decision"}`
          ),
          sender_user_id: ctx.actorUserId ?? null,
          metadata: {
            source: "founder_intelligence",
            workflowAction: actionType,
            triggerKey: ctx.triggerKey,
            decisionId: ctx.entityId,
          },
        });
        return {
          ok: true,
          actionType,
          message: `${actionType} queued`,
          output: { entityId: ctx.entityId },
        };
      }

      case "assign_employee":
      case "schedule_meeting":
      case "call_provider_adapter":
        return {
          ok: true,
          actionType,
          message: `${actionType} deferred to provider / extension adapter`,
          deferred: true,
          output: { config },
        };

      case "wait":
        return {
          ok: true,
          actionType,
          message: `Wait ${Number(config.ms ?? config.seconds ?? 0)} recorded`,
          output: { waitMs: Number(config.ms ?? (Number(config.seconds ?? 0) * 1000)) },
        };

      case "branch":
        return {
          ok: true,
          actionType,
          message: "Branch evaluated via graph edges",
          output: { branch: config.branch ?? "default" },
        };

      case "add_timeline_event":
      case "publish_executive_event": {
        const { recordActivity } = await import("@/lib/platform/activity");
        if (!ctx.organizationId && !ctx.schoolId) {
          return {
            ok: true,
            actionType,
            message: "Timeline event skipped (no school/org context)",
            deferred: true,
          };
        }
        const result = await recordActivity(supabase, {
          eventType: "note.created",
          moduleKey: "platform",
          entityType: ctx.entityType ?? "workflow",
          entityId: ctx.entityId ?? ctx.activityEventId ?? crypto.randomUUID(),
          title: String(config.title ?? node.label),
          summary: String(config.body ?? "Workflow timeline event"),
          organizationId: ctx.organizationId ?? undefined,
          schoolId: ctx.schoolId ?? undefined,
          studentId: ctx.studentId ?? undefined,
          familyId: ctx.familyId ?? undefined,
          actorUserId: ctx.actorUserId ?? undefined,
          payload: { workflowTrigger: ctx.triggerKey, actionType },
        });
        return {
          ok: !result.error,
          actionType,
          message: result.error ?? "Timeline / executive event published",
          output: { activityId: result.id },
        };
      }

      default:
        return {
          ok: true,
          actionType,
          message: `Unknown action ${actionType} skipped`,
          deferred: true,
        };
    }
  } catch (error) {
    return {
      ok: false,
      actionType,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
