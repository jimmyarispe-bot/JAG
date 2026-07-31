import type {
  ConnectorMappingInterface,
  ExternalRecord,
  MappedEvidenceDraft,
} from "@/lib/connectors/mapping";
import {
  QBO_CONNECTOR_ID,
  QBO_REPORT_LABELS,
  type QboReportPayload,
  type QboReportType,
} from "@/lib/connectors/quickbooks/types";

export function mapQboReportToEvidenceDraft(
  report: QboReportPayload
): MappedEvidenceDraft {
  const label = QBO_REPORT_LABELS[report.reportType];
  return {
    name: `${label} — ${report.companyName} (${report.periodLabel})`,
    domain: "Financial Intelligence",
    evidenceType: "Financial Statement",
    source: "QuickBooks",
    reportingPeriodLabel: report.periodLabel,
    metadata: {
      connectorId: QBO_CONNECTOR_ID,
      reportType: report.reportType,
      companyId: report.companyId,
      companyName: report.companyName,
      generatedAt: report.generatedAt,
      rowCount: String(report.rows.length),
    },
  };
}

export const quickBooksMapping: ConnectorMappingInterface = {
  connectorId: QBO_CONNECTOR_ID,
  mapToEvidence(record: ExternalRecord): MappedEvidenceDraft {
    const report = record.payload as unknown as QboReportPayload;
    if (!report?.reportType || !report.companyId) {
      return {
        name: "QuickBooks Report",
        domain: "Financial Intelligence",
        evidenceType: "Financial Statement",
        source: "QuickBooks",
        metadata: { externalId: record.externalId },
      };
    }
    return mapQboReportToEvidenceDraft(report);
  },
};

export function reportFileName(reportType: QboReportType, periodLabel: string): string {
  const slug = QBO_REPORT_LABELS[reportType]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  // Evidence Center accepts txt (not json) — payload remains JSON text.
  return `qbo-${slug}-${periodLabel.replace(/\s+/g, "")}.txt`;
}
