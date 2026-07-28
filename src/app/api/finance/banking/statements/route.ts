import {
  createFinanceEngine,
  createTreasuryEngine,
  type StatementImportBatch,
} from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg,
  requireFinanceOrgBody,
} from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createTreasuryEngine();
  return jsonOk(
    {
      batches: engine.listStatementBatches(gate.organizationId),
      formats: engine.importFormats,
      ocr: engine.ocrHook,
      legacyImports: engine.listBankImports(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "preview" | "validate" | "commit" | "rollback";
    bankAccountId?: string;
    format?: StatementImportBatch["format"];
    fileName?: string;
    batchId?: string;
    rows?: {
      externalId: string;
      amount: number;
      description: string;
      date: string;
    }[];
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "financial_administrator", "controller"]),
    actorUserId: userId,
  });
  const engine = createTreasuryEngine();

  if (body.action === "validate") {
    const batch = engine.validateImport({
      organizationId: gate.organizationId,
      userId,
      batchId: body.batchId ?? "",
    });
    if ("error" in batch) return jsonError(JagErrors.validation(batch.error));
    return jsonOk({ batch }, { correlationId: gate.correlationId });
  }
  if (body.action === "commit") {
    const batch = engine.commitImport({
      organizationId: gate.organizationId,
      userId,
      batchId: body.batchId ?? "",
    });
    if ("error" in batch) return jsonError(JagErrors.validation(batch.error));
    return jsonOk(
      { batch },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "rollback") {
    const batch = engine.rollbackImport({
      organizationId: gate.organizationId,
      userId,
      batchId: body.batchId ?? "",
    });
    if ("error" in batch) return jsonError(JagErrors.validation(batch.error));
    return jsonOk({ batch }, { correlationId: gate.correlationId });
  }

  const batch = engine.previewImport({
    organizationId: gate.organizationId,
    userId,
    bankAccountId: body.bankAccountId ?? "",
    format: body.format ?? "csv",
    fileName: body.fileName ?? "statement.csv",
    rows: body.rows,
  });
  if ("error" in batch) return jsonError(JagErrors.validation(batch.error));
  return jsonOk(
    { batch },
    { correlationId: gate.correlationId, status: 201 }
  );
}
