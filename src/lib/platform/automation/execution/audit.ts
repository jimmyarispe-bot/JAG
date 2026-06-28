import type {
  AutomationAuditEntry,
  AutomationExecutionResult,
} from "@/lib/platform/automation/engine-types";

let auditSequence = 0;

const AUTOMATION_AUDIT_BUFFER: AutomationAuditEntry[] = [];

export function buildAutomationAuditEntry(
  result: AutomationExecutionResult,
  summary: string,
  metadata?: Record<string, unknown>
): AutomationAuditEntry {
  auditSequence += 1;
  return {
    auditId: `autoa_${Date.now()}_${auditSequence}`,
    executionId: result.executionId,
    automationKey: result.automationKey,
    triggerKey: result.triggerKey,
    status: result.status,
    summary,
    result,
    recordedAt: new Date().toISOString(),
    metadata,
  };
}

export function recordAutomationAuditEntry(entry: AutomationAuditEntry): void {
  AUTOMATION_AUDIT_BUFFER.push(entry);
}

export function getAutomationAuditEntries(): AutomationAuditEntry[] {
  return [...AUTOMATION_AUDIT_BUFFER];
}

export function clearAutomationAuditBuffer(): void {
  AUTOMATION_AUDIT_BUFFER.length = 0;
}

export function resetAutomationAuditSequence(): void {
  auditSequence = 0;
  AUTOMATION_AUDIT_BUFFER.length = 0;
}
