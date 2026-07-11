/**
 * Support Intelligence — remediation playbooks.
 *
 * Recommends tenant-agnostic remediation steps by support category.
 * No organization-specific procedures and no side effects.
 */

import type {
  SupportCategory,
  SupportPlaybook,
  SupportPlaybookStep,
} from "@/lib/platform/intelligence/domains/support/types";
import type { IntelligenceActionAuthority } from "@/lib/platform/intelligence/types";

interface PlaybookDefinition {
  title: string;
  summary: string;
  escalationGuidance: string;
  steps: ReadonlyArray<{
    stepKey: string;
    label: string;
    instruction: string;
    authority: IntelligenceActionAuthority;
    optional?: boolean;
  }>;
}

const PLAYBOOK_DEFINITIONS: Record<SupportCategory, PlaybookDefinition> = {
  authentication: {
    title: "Authentication Recovery",
    summary: "Guide the user through safe authentication recovery steps",
    escalationGuidance: "Escalate if account is disabled or auth provider is unhealthy",
    steps: [
      {
        stepKey: "auth.clear_session",
        label: "Clear session",
        instruction: "Sign out fully and clear site cookies for the JAG domain",
        authority: "recommend",
      },
      {
        stepKey: "auth.retry_login",
        label: "Retry secure login",
        instruction: "Attempt login again with known-good credentials",
        authority: "recommend",
      },
      {
        stepKey: "auth.reset_password",
        label: "Password reset",
        instruction: "Start a password reset if credentials may be stale",
        authority: "recommend",
      },
      {
        stepKey: "auth.verify_account_status",
        label: "Verify account status",
        instruction: "Confirm the account is enabled and not locked",
        authority: "requires_human",
      },
    ],
  },
  payments: {
    title: "Payment Discrepancy Review",
    summary: "Reconcile reported payment issues without mutating ledgers automatically",
    escalationGuidance: "Escalate financial mutations to authorized finance staff",
    steps: [
      {
        stepKey: "pay.confirm_reference",
        label: "Confirm payment reference",
        instruction: "Collect payment reference, amount, and approximate time",
        authority: "recommend",
      },
      {
        stepKey: "pay.check_ledger",
        label: "Check ledger visibility",
        instruction: "Verify whether the payment appears on the student or family ledger",
        authority: "recommend",
      },
      {
        stepKey: "pay.safe_refresh",
        label: "Refresh balances",
        instruction: "Refresh balance projections if a safe refresh action is available",
        authority: "auto_safe",
        optional: true,
      },
      {
        stepKey: "pay.finance_review",
        label: "Finance review",
        instruction: "Route to finance for posting, void, or refund decisions",
        authority: "requires_human",
      },
    ],
  },
  billing: {
    title: "Billing Review",
    summary: "Validate invoice and fee schedule alignment",
    escalationGuidance: "Escalate fee schedule changes to billing administrators",
    steps: [
      {
        stepKey: "bill.verify_invoice",
        label: "Verify invoice",
        instruction: "Open the invoice and confirm line items and dates",
        authority: "recommend",
      },
      {
        stepKey: "bill.check_scholarships",
        label: "Check scholarships",
        instruction: "Confirm scholarship or discount application status",
        authority: "recommend",
      },
      {
        stepKey: "bill.recalculate_preview",
        label: "Recalculate preview",
        instruction: "Run a non-destructive invoice recalculation preview if available",
        authority: "auto_safe",
        optional: true,
      },
    ],
  },
  scheduling: {
    title: "Scheduling Issue Recovery",
    summary: "Resolve schedule conflicts and stale roster symptoms",
    escalationGuidance: "Escalate capacity overrides to scheduling administrators",
    steps: [
      {
        stepKey: "sch.identify_conflict",
        label: "Identify conflict",
        instruction: "Locate overlapping sections, rooms, or staff assignments",
        authority: "recommend",
      },
      {
        stepKey: "sch.refresh_roster",
        label: "Refresh roster view",
        instruction: "Reload the roster/schedule view to rule out stale UI state",
        authority: "recommend",
      },
      {
        stepKey: "sch.adjust_assignment",
        label: "Adjust assignment",
        instruction: "Propose a schedule adjustment for human approval",
        authority: "requires_human",
      },
    ],
  },
  workflow: {
    title: "Workflow Failure Recovery",
    summary: "Unblock stalled workflow instances safely",
    escalationGuidance: "Escalate destructive retries or forced transitions",
    steps: [
      {
        stepKey: "wf.inspect_state",
        label: "Inspect workflow state",
        instruction: "Identify current state, guard failures, and last transition error",
        authority: "recommend",
      },
      {
        stepKey: "wf.retry_safe",
        label: "Retry safe step",
        instruction: "Retry the last idempotent workflow step if marked auto-safe",
        authority: "auto_safe",
        optional: true,
      },
      {
        stepKey: "wf.manual_transition",
        label: "Manual transition",
        instruction: "Request authorized manual transition or approval completion",
        authority: "requires_human",
      },
    ],
  },
  permissions: {
    title: "Permissions Remediation",
    summary: "Align granted permissions with required access",
    escalationGuidance: "Never auto-grant elevated permissions",
    steps: [
      {
        stepKey: "perm.identify_required",
        label: "Identify required permission",
        instruction: "Determine which permission or role is required for the action",
        authority: "recommend",
      },
      {
        stepKey: "perm.compare_grants",
        label: "Compare grants",
        instruction: "Compare required keys against the actor's current grants",
        authority: "recommend",
      },
      {
        stepKey: "perm.request_grant",
        label: "Request grant",
        instruction: "Submit a human-approved role or permission change request",
        authority: "requires_human",
      },
    ],
  },
  missing_records: {
    title: "Missing Record Investigation",
    summary: "Locate or reconstruct missing operational records",
    escalationGuidance: "Escalate suspected data loss to platform operations",
    steps: [
      {
        stepKey: "rec.search_identifiers",
        label: "Search alternate identifiers",
        instruction: "Search by name, email, external id, and recent activity",
        authority: "recommend",
      },
      {
        stepKey: "rec.check_filters",
        label: "Check filters and scope",
        instruction: "Disable restrictive filters and confirm school/org scope",
        authority: "recommend",
      },
      {
        stepKey: "rec.restore_or_recreate",
        label: "Restore or recreate",
        instruction: "Propose restore/recreate only with human authorization",
        authority: "requires_human",
      },
    ],
  },
  synchronization: {
    title: "Synchronization Recovery",
    summary: "Address stale or failed synchronization symptoms",
    escalationGuidance: "Escalate destructive re-indexes or full rebuilds",
    steps: [
      {
        stepKey: "sync.check_last_run",
        label: "Check last sync",
        instruction: "Review last successful sync time and recent errors",
        authority: "recommend",
      },
      {
        stepKey: "sync.retry_safe",
        label: "Safe re-sync",
        instruction: "Trigger an idempotent re-sync when policy allows",
        authority: "auto_safe",
        optional: true,
      },
      {
        stepKey: "sync.escalate_connector",
        label: "Escalate connector",
        instruction: "Escalate persistent connector failures to integrations owners",
        authority: "requires_human",
      },
    ],
  },
  reporting: {
    title: "Reporting Issue Recovery",
    summary: "Restore expected report output without mutating source data",
    escalationGuidance: "Escalate report definition defects to analytics owners",
    steps: [
      {
        stepKey: "rpt.verify_filters",
        label: "Verify filters",
        instruction: "Confirm date range, school scope, and status filters",
        authority: "recommend",
      },
      {
        stepKey: "rpt.verify_permissions",
        label: "Verify report permissions",
        instruction: "Confirm the actor can view the underlying data",
        authority: "recommend",
      },
      {
        stepKey: "rpt.regenerate",
        label: "Regenerate report",
        instruction: "Regenerate or refresh the report projection if auto-safe",
        authority: "auto_safe",
        optional: true,
      },
    ],
  },
  integrations: {
    title: "Integration Failure Recovery",
    summary: "Diagnose and safely recover third-party integration issues",
    escalationGuidance: "Credential rotation and mapping changes require humans",
    steps: [
      {
        stepKey: "int.check_health",
        label: "Check connector health",
        instruction: "Review connector health and last delivery status",
        authority: "recommend",
      },
      {
        stepKey: "int.retry_delivery",
        label: "Retry delivery",
        instruction: "Retry the last failed idempotent delivery if permitted",
        authority: "auto_safe",
        optional: true,
      },
      {
        stepKey: "int.credential_review",
        label: "Credential review",
        instruction: "Have an administrator validate integration credentials",
        authority: "requires_human",
      },
    ],
  },
  student_information: {
    title: "Student Information Review",
    summary: "Validate student profile completeness and linkages",
    escalationGuidance: "PII corrections require authorized staff",
    steps: [
      {
        stepKey: "sis.verify_identity",
        label: "Verify identity fields",
        instruction: "Confirm student identifiers and enrollment status",
        authority: "recommend",
      },
      {
        stepKey: "sis.correct_record",
        label: "Correct record",
        instruction: "Propose field corrections for human approval",
        authority: "requires_human",
      },
    ],
  },
  attendance: {
    title: "Attendance Issue Recovery",
    summary: "Recover failed attendance submissions safely",
    escalationGuidance: "Historical attendance overrides require authorized staff",
    steps: [
      {
        stepKey: "att.retry_submit",
        label: "Retry submission",
        instruction: "Retry attendance save for the open session",
        authority: "recommend",
      },
      {
        stepKey: "att.verify_session",
        label: "Verify session window",
        instruction: "Confirm the class session is open for attendance entry",
        authority: "recommend",
      },
      {
        stepKey: "att.manual_correct",
        label: "Manual correction",
        instruction: "Request authorized manual attendance correction if needed",
        authority: "requires_human",
      },
    ],
  },
  communications: {
    title: "Communications Recovery",
    summary: "Restore expected messaging delivery",
    escalationGuidance: "Broadcast permission changes require administrators",
    steps: [
      {
        stepKey: "com.verify_recipients",
        label: "Verify recipients",
        instruction: "Confirm recipient list and audience scope",
        authority: "recommend",
      },
      {
        stepKey: "com.resend",
        label: "Resend message",
        instruction: "Resend if the channel supports safe retry",
        authority: "auto_safe",
        optional: true,
      },
    ],
  },
  notifications: {
    title: "Notification Delivery Recovery",
    summary: "Investigate and retry notification delivery",
    escalationGuidance: "Preference overrides that expand scope require consent review",
    steps: [
      {
        stepKey: "ntf.check_prefs",
        label: "Check preferences",
        instruction: "Confirm user notification preferences are enabled",
        authority: "recommend",
      },
      {
        stepKey: "ntf.retry_queue",
        label: "Retry queue item",
        instruction: "Retry failed notification queue items when auto-safe",
        authority: "auto_safe",
        optional: true,
      },
    ],
  },
  email: {
    title: "Email Delivery Recovery",
    summary: "Diagnose outbound email delivery problems",
    escalationGuidance: "Provider credential changes require administrators",
    steps: [
      {
        stepKey: "eml.verify_address",
        label: "Verify address",
        instruction: "Confirm the recipient email address is correct",
        authority: "recommend",
      },
      {
        stepKey: "eml.resend",
        label: "Resend email",
        instruction: "Resend the message if delivery retry is permitted",
        authority: "auto_safe",
        optional: true,
      },
    ],
  },
  mobile: {
    title: "Mobile Client Recovery",
    summary: "Resolve common mobile client issues",
    escalationGuidance: "Escalate persistent crashes with device diagnostics",
    steps: [
      {
        stepKey: "mob.update_app",
        label: "Update app",
        instruction: "Ensure the mobile app is on a supported version",
        authority: "recommend",
      },
      {
        stepKey: "mob.clear_cache",
        label: "Clear cache",
        instruction: "Clear app cache and retry the failing action",
        authority: "recommend",
      },
    ],
  },
  performance: {
    title: "Performance Degradation Response",
    summary: "Guide users through transient performance issues",
    escalationGuidance: "Escalate sustained timeouts to platform operations",
    steps: [
      {
        stepKey: "perf.retry",
        label: "Retry operation",
        instruction: "Retry the action after a short wait",
        authority: "recommend",
      },
      {
        stepKey: "perf.capture_timing",
        label: "Capture timing",
        instruction: "Note time of day and steps to reproduce for escalation",
        authority: "recommend",
      },
    ],
  },
  general: {
    title: "General Support Triage",
    summary: "Collect enough information to specialize the case",
    escalationGuidance: "Escalate when impact is high and category remains unclear",
    steps: [
      {
        stepKey: "gen.clarify",
        label: "Clarify issue",
        instruction: "Ask what the user expected versus what happened",
        authority: "recommend",
      },
      {
        stepKey: "gen.collect_evidence",
        label: "Collect evidence",
        instruction: "Collect screenshots, error text, and affected module",
        authority: "recommend",
      },
      {
        stepKey: "gen.reclassify",
        label: "Reclassify",
        instruction: "Re-run classification after additional evidence is attached",
        authority: "observe_only",
      },
    ],
  },
};

/** Optional playbook service configuration. */
export interface SupportPlaybooksOptions {
  /** Include optional playbook steps (default true). */
  includeOptionalSteps?: boolean;
}

/**
 * Resolves category playbooks and remediation steps.
 */
export class SupportPlaybooks {
  private readonly includeOptionalSteps: boolean;

  /**
   * @param options - Playbook selection options (tenant-agnostic).
   */
  constructor(options: SupportPlaybooksOptions = {}) {
    this.includeOptionalSteps = options.includeOptionalSteps ?? true;
  }

  /**
   * Get the remediation playbook for a support category.
   * @param category - Classified support category.
   */
  getPlaybook(category: SupportCategory): SupportPlaybook {
    const definition = PLAYBOOK_DEFINITIONS[category];
    const steps: SupportPlaybookStep[] = definition.steps
      .filter((step) => this.includeOptionalSteps || !step.optional)
      .map((step, index) => ({
        stepKey: step.stepKey,
        label: step.label,
        instruction: step.instruction,
        authority: step.authority,
        order: index + 1,
        optional: step.optional,
      }));

    return {
      playbookKey: `support.playbook.${category}`,
      category,
      title: definition.title,
      summary: definition.summary,
      steps,
      escalationGuidance: definition.escalationGuidance,
    };
  }

  /**
   * List all category playbooks available in this domain pack.
   */
  listPlaybooks(): SupportPlaybook[] {
    return (Object.keys(PLAYBOOK_DEFINITIONS) as SupportCategory[]).map((category) =>
      this.getPlaybook(category)
    );
  }
}
