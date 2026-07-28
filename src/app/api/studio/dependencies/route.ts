import { createDependencyEngine } from "@studio";
import { jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const engine = createDependencyEngine();
  const report = engine.analyze({
    force: searchParams.get("force") === "1",
  });
  const severity = searchParams.get("severity");
  const rule = searchParams.get("rule");
  const q = searchParams.get("q")?.trim().toLowerCase();
  let issues = [...report.issues];
  if (severity) issues = issues.filter((i) => i.severity === severity);
  if (rule) issues = issues.filter((i) => i.rule === rule);
  if (q) {
    issues = issues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.detail.toLowerCase().includes(q) ||
        i.rule.toLowerCase().includes(q)
    );
  }
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize") ?? 50))
  );
  const total = issues.length;
  const start = (page - 1) * pageSize;

  return jsonOk(
    {
      riskScore: report.riskScore,
      circularDependencies: report.circularDependencies,
      analyzedAt: report.analyzedAt,
      issues: issues.slice(start, start + pageSize),
      pagination: { page, pageSize, total },
      counts: engine.bySeverity().counts,
    },
    { correlationId: gate.correlationId }
  );
}
