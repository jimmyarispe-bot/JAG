import { ReleaseDashboard } from "@/components/executive/ReleaseDashboard";
import {
  buildReleaseDashboardRows,
  buildReleaseReport,
} from "@/lib/platform/release";

export default function ExecutiveReleasePage() {
  const report = buildReleaseReport();
  const rows = buildReleaseDashboardRows();

  return (
    <div className="space-y-4 p-1">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Module Release Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          AcademyOS Module Completion Standard (v2) — CRUD, Security, Workflow, EI, Tests, Docs,
          Accessibility, Mobile, Performance, Integrations, and Production readiness across every
          platform module.
        </p>
      </div>
      <ReleaseDashboard rows={rows} generatedAt={report.generatedAt} ok={report.ok} />
    </div>
  );
}
