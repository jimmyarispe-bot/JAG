import Link from "next/link";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { CertShell } from "@/components/certification/CertNav";
import { CertTable } from "@/components/certification/CertPanels";
import {
  APPROVAL_FORMS,
  GOVERNANCE_CHECKLISTS,
  buildGoNoGoDecisionMatrix,
  buildReleaseDashboard,
  getReleaseGovernanceStore,
} from "@/lib/certification/release-governance";

function statusClass(status: string): string {
  switch (status) {
    case "pass":
    case "complete":
    case "approved":
      return "text-emerald-700";
    case "conditional":
    case "waived":
      return "text-amber-700";
    case "fail":
    case "rejected":
    case "blocked":
      return "text-red-700";
    case "not_executed":
      return "text-orange-700";
    default:
      return "text-slate-600";
  }
}

export default async function ReleaseGovernancePage() {
  await requirePagePermission(["certification.view", "certification.manage", "certification.admin"]);

  const store = getReleaseGovernanceStore();
  const dash = buildReleaseDashboard(store);
  const matrix = buildGoNoGoDecisionMatrix(store);
  const release = dash.release;
  const audit = store.audit.list(release.id).slice(-12).reverse();

  const checklistRows = GOVERNANCE_CHECKLISTS.map((c) => {
    const rows = release.checklistProgress[c.id] ?? [];
    const required = c.items.filter((i) => i.required).length;
    const done = rows.filter(
      (r) => r.status === "complete" || r.status === "waived" || r.status === "na"
    ).length;
    return {
      id: c.id,
      title: c.title,
      phase: c.phase,
      progress: `${done}/${required}`,
      pct: required ? Math.round((done / required) * 100) : 0,
    };
  });

  const gateRows = dash.gates.map((g) => ({
    domain: g.domain.replace(/_/g, " "),
    status: g.status,
  }));

  return (
    <CertShell
      title="Release Governance Dashboard"
      subtitle="Internal RC1–RC4 / GA governance — not a customer-facing surface"
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current release</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {release.name} {release.version}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current phase</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{dash.stateDefinition.label}</p>
          <p className="mt-1 text-xs text-slate-500">{dash.stateDefinition.description}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Production readiness</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{release.productionReadinessPercent}%</p>
          <p className={`mt-1 text-xs font-medium ${statusClass(release.riskLevel)}`}>
            Risk: {release.riskLevel}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checklist completion</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{dash.checklistCompletionPercent}%</p>
          <p className="mt-1 text-xs text-slate-500">
            Critical bugs: {release.defectCounts.critical} · High: {release.defectCounts.high}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Go / No-Go eligible: {dash.goNoGoEligible ? "Yes" : "No"}</p>
        <p className="mt-1">
          Seeded from Phase G evidence. Governance docs:{" "}
          <Link className="underline" href="/dashboard/certification/documentation">
            Documentation Center
          </Link>{" "}
          · package path <code className="rounded bg-white/80 px-1">docs/launch/phase-g1/</code>
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold text-slate-900">Domain status</h2>
          <CertTable
            rows={gateRows}
            columns={[
              { key: "domain", label: "Domain" },
              { key: "status", label: "Status" },
            ]}
          />
        </div>
        <div>
          <h2 className="mb-2 font-semibold text-slate-900">Defect snapshot</h2>
          <ul className="space-y-1 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <li>Critical: <strong>{release.defectCounts.critical}</strong></li>
            <li>High: <strong>{release.defectCounts.high}</strong></li>
            <li>Medium: <strong>{release.defectCounts.medium}</strong></li>
            <li>Low: <strong>{release.defectCounts.low}</strong></li>
            <li className="pt-2 text-slate-600">Known issues: {release.knownIssuesRef}</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">Checklist completion</h2>
        <CertTable
          rows={checklistRows}
          columns={[
            { key: "phase", label: "Phase" },
            { key: "title", label: "Checklist" },
            { key: "progress", label: "Progress" },
            { key: "pct", label: "%" },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">Approvals</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Open</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {dash.openApprovals.map((id) => {
                const form = APPROVAL_FORMS.find((f) => f.id === id);
                return <li key={id}>{form?.title ?? id}</li>;
              })}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Completed</p>
            {dash.completedApprovals.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">None recorded yet.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {dash.completedApprovals.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">Go / No-Go decision matrix</h2>
        <CertTable
          rows={matrix.map((r) => ({
            criterion: r.criterion,
            required: r.required,
            actual: r.actual,
            result: r.pass ? "pass" : "fail",
          }))}
          columns={[
            { key: "criterion", label: "Criterion" },
            { key: "required", label: "Required" },
            { key: "actual", label: "Actual" },
            { key: "result", label: "Result" },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">Audit trail (recent)</h2>
        <CertTable
          rows={audit.map((e) => ({
            at: e.at,
            type: e.type,
            actor: e.actor,
            summary: e.summary,
          }))}
          columns={[
            { key: "at", label: "When" },
            { key: "type", label: "Type" },
            { key: "actor", label: "Actor" },
            { key: "summary", label: "Summary" },
          ]}
        />
        <p className="mt-2 text-xs text-slate-500">
          Append-only in-process audit trail ({dash.auditEventCount} events). See governance manual for persistence
          policy.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Next allowed state(s)</p>
        <p className="mt-1">
          {dash.nextAllowedStates.length
            ? dash.nextAllowedStates.join(", ")
            : "None (terminal or blocked)"}
        </p>
        <p className="mt-2">
          Entry criteria: {dash.stateDefinition.entryCriteria.join("; ")}
        </p>
        <p className="mt-1">
          Exit criteria: {dash.stateDefinition.exitCriteria.join("; ")}
        </p>
      </section>
    </CertShell>
  );
}
