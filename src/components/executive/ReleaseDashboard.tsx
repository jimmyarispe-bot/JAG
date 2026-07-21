import type { GateResult, GateVerdict, ModuleReadinessStatus } from "@/lib/platform/release";

type CellMap = {
  crud: GateResult;
  security: GateResult;
  workflow: GateResult;
  ei: GateResult;
  tests: GateResult;
  docs: GateResult;
  accessibility: GateResult;
  mobile: GateResult;
  performance: GateResult;
  extension: GateResult;
  production: GateResult;
};

export interface ReleaseDashboardRow {
  id: string;
  label: string;
  status: ModuleReadinessStatus;
  effectiveStatus: ModuleReadinessStatus;
  overallScore: number;
  overallVerdict: GateVerdict;
  notes?: string;
  cells: CellMap;
}

function verdictGlyph(v: GateVerdict): { symbol: string; className: string; label: string } {
  switch (v) {
    case "pass":
      return { symbol: "✅", className: "text-emerald-700", label: "Pass" };
    case "warn":
    case "pending":
      return { symbol: "⚠️", className: "text-amber-700", label: v === "pending" ? "Pending" : "Warn" };
    case "fail":
      return { symbol: "🚧", className: "text-rose-700", label: "Fail" };
    case "na":
      return { symbol: "—", className: "text-slate-400", label: "N/A" };
    default:
      return { symbol: "?", className: "text-slate-500", label: "Unknown" };
  }
}

function statusBadge(status: ModuleReadinessStatus) {
  const tones: Record<string, string> = {
    planned: "bg-slate-100 text-slate-600",
    building: "bg-sky-50 text-sky-800",
    "feature-complete": "bg-indigo-50 text-indigo-800",
    "crud-complete": "bg-violet-50 text-violet-800",
    "workflow-complete": "bg-fuchsia-50 text-fuchsia-800",
    "ei-complete": "bg-purple-50 text-purple-800",
    tested: "bg-teal-50 text-teal-800",
    "production-ready": "bg-emerald-50 text-emerald-800",
    released: "bg-emerald-100 text-emerald-900",
  };
  return tones[status] ?? "bg-slate-100 text-slate-700";
}

function GateCell({ gate }: { gate: GateResult }) {
  const g = verdictGlyph(gate.verdict);
  return (
    <td
      className="px-2 py-2 text-center"
      title={`${gate.summary}${gate.issues.length ? `\n${gate.issues.join("\n")}` : ""}`}
    >
      <span
        className={`text-base ${g.className}`}
        aria-label={`${gate.gate}: ${g.label} (${gate.score})`}
      >
        {g.symbol}
      </span>
    </td>
  );
}

interface ReleaseDashboardProps {
  rows: ReleaseDashboardRow[];
  generatedAt: string;
  ok: boolean;
}

export function ReleaseDashboard({ rows, generatedAt, ok }: ReleaseDashboardProps) {
  const passCount = rows.filter((r) => r.overallVerdict === "pass").length;
  const warnCount = rows.filter((r) => r.overallVerdict === "warn").length;
  const failCount = rows.filter((r) => r.overallVerdict === "fail").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Modules</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-xs uppercase text-emerald-700">Pass</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">{passCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-xs uppercase text-amber-700">Warn</p>
          <p className="mt-1 text-2xl font-semibold text-amber-900">{warnCount}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <p className="text-xs uppercase text-rose-700">Fail</p>
          <p className="mt-1 text-2xl font-semibold text-rose-900">{failCount}</p>
        </div>
      </div>

      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-rose-200 bg-rose-50 text-rose-900"
        }`}
        role="status"
      >
        {ok
          ? "Release aggregate gate is clear for production-ready modules."
          : "Release aggregate gate has blocking issues — see modules marked fail."}
        <span className="mt-1 block text-xs opacity-80">
          Evaluated {new Date(generatedAt).toLocaleString()} · Standard v2 · RC11 readiness columns
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">
            Module production readiness matrix including accessibility, mobile, performance,
            security, integrations, and tests
          </caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3" scope="col">
                Module
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                CRUD
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                Security
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                Workflow
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                EI
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                Tests
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                Docs
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                A11y
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                Mobile
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                Perf
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                Integr.
              </th>
              <th className="px-2 py-3 text-center" scope="col">
                Prod
              </th>
              <th className="px-3 py-3" scope="col">
                Status
              </th>
              <th className="px-3 py-3" scope="col">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-3 py-3">
                  <p className="font-medium text-slate-900">{row.label}</p>
                  {row.notes ? (
                    <p className="mt-0.5 max-w-xs text-xs text-slate-500">{row.notes}</p>
                  ) : null}
                </td>
                <GateCell gate={row.cells.crud} />
                <GateCell gate={row.cells.security} />
                <GateCell gate={row.cells.workflow} />
                <GateCell gate={row.cells.ei} />
                <GateCell gate={row.cells.tests} />
                <GateCell gate={row.cells.docs} />
                <GateCell gate={row.cells.accessibility} />
                <GateCell gate={row.cells.mobile} />
                <GateCell gate={row.cells.performance} />
                <GateCell gate={row.cells.extension} />
                <GateCell gate={row.cells.production} />
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(row.effectiveStatus)}`}
                  >
                    {row.effectiveStatus}
                  </span>
                  {row.effectiveStatus !== row.status ? (
                    <p className="mt-1 text-[10px] text-slate-400">declared {row.status}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3 font-medium text-slate-800">{row.overallScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Legend: ✅ pass · ⚠️ warn/pending · 🚧 fail · — n/a. Hover a cell for details. Integr. =
        extension/provider gate. Observability:{" "}
        <a href="/dashboard/executive/observability" className="underline">
          /dashboard/executive/observability
        </a>
        . Standard:{" "}
        <code className="rounded bg-slate-100 px-1">docs/platform/module-completion-standard.md</code>
      </p>
    </div>
  );
}
