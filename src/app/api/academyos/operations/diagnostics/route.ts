import {
  buildOperationsDashboard,
  getLastOperationsDashboard,
  runDiagnostics,
} from "@academyos";
import { evaluateAcademyOsRc3WithStudio } from "@studio";
import { jsonOk, requireAcademyOsOrg, requireAcademyOsOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  if (searchParams.get("dashboard") === "1") {
    const last = getLastOperationsDashboard();
    return jsonOk(
      { dashboard: last },
      { correlationId: gate.correlationId }
    );
  }
  const last = getLastOperationsDashboard();
  return jsonOk(
    { diagnostics: last?.diagnostics ?? runDiagnostics() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    seedDemo?: boolean;
    registerWithStudio?: boolean;
    fullDashboard?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  if (body.fullDashboard) {
    if (body.registerWithStudio !== false) {
      const evaluation = evaluateAcademyOsRc3WithStudio({
        organizationId: gate.organizationId,
        seedDemo: body.seedDemo !== false,
      });
      return jsonOk(
        { dashboard: evaluation.dashboard, studio: evaluation },
        { correlationId: gate.correlationId, status: 201 }
      );
    }
    const dashboard = buildOperationsDashboard({
      organizationId: gate.organizationId,
      seedDemo: body.seedDemo !== false,
    });
    return jsonOk(
      { dashboard },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const diagnostics = runDiagnostics({
    organizationId: gate.organizationId,
  });
  return jsonOk(
    { diagnostics },
    { correlationId: gate.correlationId, status: 201 }
  );
}
