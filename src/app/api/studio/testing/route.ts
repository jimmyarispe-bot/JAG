import { createTestingWorkspaceService } from "@studio";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireStudioOrg,
  requireStudioOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  return jsonOk(
    { testing: createTestingWorkspaceService().view() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    suiteId?: string;
    passed?: number;
    failed?: number;
    skipped?: number;
    coveragePercent?: number | null;
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.suiteId || body.passed == null || body.failed == null) {
    return jsonError(
      JagErrors.validation("suiteId, passed, and failed are required.")
    );
  }
  const run = createTestingWorkspaceService().recordRun({
    suiteId: body.suiteId,
    passed: body.passed,
    failed: body.failed,
    skipped: body.skipped,
    coveragePercent: body.coveragePercent,
    actor: gate.session.userId,
  });
  return jsonOk({ run }, { correlationId: gate.correlationId, status: 201 });
}
