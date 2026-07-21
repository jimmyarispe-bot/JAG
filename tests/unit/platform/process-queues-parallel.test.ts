import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Structural test: processAllPlatformQueues must fan out independent work.
 * Heavy module processors are mocked so this stays a unit test.
 */

const mocks = vi.hoisted(() => ({
  processWorkflowQueue: vi.fn(async () => undefined),
  processCommunicationQueue: vi.fn(async () => undefined),
  syncAdmissionsQueueToPlatform: vi.fn(async () => undefined),
  syncFailedAutomationsToMissionControl: vi.fn(async () => undefined),
  processSpedReviewReminders: vi.fn(async () => undefined),
  processMedicalDocumentExpiryAlerts: vi.fn(async () => undefined),
  processDisengagedFamilies: vi.fn(async () => undefined),
  processAttendanceParentNotifications: vi.fn(async () => undefined),
  processSchedulingIntelligenceQueue: vi.fn(async () => undefined),
  syncTeacherComplianceToMissionControl: vi.fn(async () => undefined),
  syncInstructionReminderJobs: vi.fn(async () => undefined),
  processInstructionReminders: vi.fn(async () => undefined),
  syncFinanceAlertsToMissionControl: vi.fn(async () => undefined),
  processFinanceQueueJobs: vi.fn(async () => undefined),
  syncHrComplianceToMissionControl: vi.fn(async () => undefined),
  syncComplianceToMissionControl: vi.fn(async () => undefined),
  syncWorkToMissionControl: vi.fn(async () => undefined),
  syncFinancialIntelligence: vi.fn(async () => undefined),
  syncExecutiveDecisionIntelligence: vi.fn(async () => undefined),
  syncEnterpriseDataPlatform: vi.fn(async () => undefined),
  syncIntelligencePlatform: vi.fn(async () => undefined),
  syncCloudPlatform: vi.fn(async () => undefined),
  syncCertificationPlatform: vi.fn(async () => undefined),
  syncIntegrationHub: vi.fn(async () => undefined),
  syncOperationsPlatform: vi.fn(async () => undefined),
  syncIntelligenceNetwork: vi.fn(async () => undefined),
  generateExecutiveInsights: vi.fn(async () => undefined),
  captureDailyExecutiveSnapshot: vi.fn(async () => undefined),
  processRc11ProductionWorkers: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/admissions/automation/queue", () => ({
  processWorkflowQueue: mocks.processWorkflowQueue,
}));
vi.mock("@/lib/admissions/communications/engine", () => ({
  processCommunicationQueue: mocks.processCommunicationQueue,
}));
vi.mock("@/lib/platform/automation/queue", () => ({
  syncAdmissionsQueueToPlatform: mocks.syncAdmissionsQueueToPlatform,
}));
vi.mock("@/lib/platform/automation/mission-control", () => ({
  syncFailedAutomationsToMissionControl: mocks.syncFailedAutomationsToMissionControl,
}));
vi.mock("@/lib/sis/reminders", () => ({
  processSpedReviewReminders: mocks.processSpedReviewReminders,
}));
vi.mock("@/lib/ssis/medical-alerts", () => ({
  processMedicalDocumentExpiryAlerts: mocks.processMedicalDocumentExpiryAlerts,
}));
vi.mock("@/lib/ssis/engagement", () => ({
  processDisengagedFamilies: mocks.processDisengagedFamilies,
}));
vi.mock("@/lib/ssis/attendance-notifications", () => ({
  processAttendanceParentNotifications: mocks.processAttendanceParentNotifications,
}));
vi.mock("@/lib/scheduling/intelligence", () => ({
  processSchedulingIntelligenceQueue: mocks.processSchedulingIntelligenceQueue,
}));
vi.mock("@/lib/teacher/compliance", () => ({
  syncTeacherComplianceToMissionControl: mocks.syncTeacherComplianceToMissionControl,
}));
vi.mock("@/lib/instruction/automation", () => ({
  syncInstructionReminderJobs: mocks.syncInstructionReminderJobs,
  processInstructionReminders: mocks.processInstructionReminders,
}));
vi.mock("@/lib/finance/automation", () => ({
  syncFinanceAlertsToMissionControl: mocks.syncFinanceAlertsToMissionControl,
  processFinanceQueueJobs: mocks.processFinanceQueueJobs,
}));
vi.mock("@/lib/hr/automation", () => ({
  syncHrComplianceToMissionControl: mocks.syncHrComplianceToMissionControl,
}));
vi.mock("@/lib/compliance/automation", () => ({
  syncComplianceToMissionControl: mocks.syncComplianceToMissionControl,
}));
vi.mock("@/lib/work/automation", () => ({
  syncWorkToMissionControl: mocks.syncWorkToMissionControl,
}));
vi.mock("@/lib/financial-intelligence/automation", () => ({
  syncFinancialIntelligence: mocks.syncFinancialIntelligence,
}));
vi.mock("@/lib/edi/automation", () => ({
  syncExecutiveDecisionIntelligence: mocks.syncExecutiveDecisionIntelligence,
}));
vi.mock("@/lib/enterprise-data/automation", () => ({
  syncEnterpriseDataPlatform: mocks.syncEnterpriseDataPlatform,
}));
vi.mock("@/lib/intelligence-platform/automation", () => ({
  syncIntelligencePlatform: mocks.syncIntelligencePlatform,
}));
vi.mock("@/lib/cloud-platform/hub", () => ({
  syncCloudPlatform: mocks.syncCloudPlatform,
}));
vi.mock("@/lib/certification/automation", () => ({
  syncCertificationPlatform: mocks.syncCertificationPlatform,
}));
vi.mock("@/lib/integration-hub/automation", () => ({
  syncIntegrationHub: mocks.syncIntegrationHub,
}));
vi.mock("@/lib/operations-platform/hub", () => ({
  syncOperationsPlatform: mocks.syncOperationsPlatform,
}));
vi.mock("@/lib/intelligence-network/automation", () => ({
  syncIntelligenceNetwork: mocks.syncIntelligenceNetwork,
}));
vi.mock("@/lib/executive/insights", () => ({
  generateExecutiveInsights: mocks.generateExecutiveInsights,
}));
vi.mock("@/lib/platform/kpi-snapshots", () => ({
  captureDailyExecutiveSnapshot: mocks.captureDailyExecutiveSnapshot,
}));
vi.mock("@/lib/production/workers", () => ({
  processRc11ProductionWorkers: mocks.processRc11ProductionWorkers,
}));

describe("processAllPlatformQueues parallel waves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invokes wave-1 processors and keeps instruction sync-before-process order", async () => {
    const order: string[] = [];
    mocks.syncInstructionReminderJobs.mockImplementation(async () => {
      order.push("sync");
    });
    mocks.processInstructionReminders.mockImplementation(async () => {
      order.push("process");
    });

    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn(async () => ({ data: [{ id: "school-1" }], error: null })),
        })),
      })),
    };

    const { processAllPlatformQueues } = await import(
      "@/lib/platform/automation/process-queues"
    );
    await processAllPlatformQueues(supabase as never);

    expect(mocks.processWorkflowQueue).toHaveBeenCalled();
    expect(mocks.processAttendanceParentNotifications).toHaveBeenCalled();
    expect(mocks.syncInstructionReminderJobs).toHaveBeenCalled();
    expect(mocks.processInstructionReminders).toHaveBeenCalled();
    expect(order.indexOf("sync")).toBeLessThan(order.indexOf("process"));
    expect(mocks.generateExecutiveInsights).toHaveBeenCalledWith(supabase, "school-1");
    expect(mocks.captureDailyExecutiveSnapshot).toHaveBeenCalled();
    expect(mocks.processRc11ProductionWorkers).toHaveBeenCalledWith(supabase);
  });
});
