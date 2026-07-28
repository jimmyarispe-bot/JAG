import { createKnowledgeEngine } from "@knowledge";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireKnowledgeOrg,
  requireKnowledgeOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireKnowledgeOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createKnowledgeEngine();
  return jsonOk(
    {
      documents: engine.listDocuments(gate.organizationId),
      types: engine.listDocumentTypes(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?:
      | "upload"
      | "version"
      | "ingest"
      | "checkout"
      | "checkin"
      | "archive"
      | "restore"
      | "classify"
      | "ocr"
      | "extract";
    documentId?: string;
    title?: string;
    content?: string;
    mimeType?: string;
    typeKey?: string;
    folderId?: string | null;
    tags?: string[];
    changeNote?: string | null;
  };
  const gate = await requireKnowledgeOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createKnowledgeEngine();
  const userId = gate.session.userId;
  const action = body.action ?? "upload";

  try {
    if (action === "ingest" || action === "upload") {
      if (!body.content || !body.title) {
        return jsonError(JagErrors.validation("title and content required"));
      }
      const result =
        action === "ingest"
          ? engine.ingest({
              organizationId: gate.organizationId,
              userId,
              title: body.title,
              content: body.content,
              mimeType: body.mimeType,
              typeKey: body.typeKey,
              folderId: body.folderId,
              tags: body.tags,
            })
          : engine.uploadDocument({
              organizationId: gate.organizationId,
              userId,
              title: body.title,
              content: body.content,
              mimeType: body.mimeType,
              typeKey: body.typeKey,
              folderId: body.folderId,
              tags: body.tags,
            });
      return jsonOk(
        { result },
        { correlationId: gate.correlationId, status: 201 }
      );
    }

    if (!body.documentId) {
      return jsonError(JagErrors.validation("documentId required"));
    }

    if (action === "version") {
      if (!body.content) {
        return jsonError(JagErrors.validation("content required"));
      }
      const version = engine.createVersion({
        organizationId: gate.organizationId,
        userId,
        documentId: body.documentId,
        content: body.content,
        mimeType: body.mimeType,
        changeNote: body.changeNote,
      });
      return jsonOk(
        { version },
        { correlationId: gate.correlationId, status: 201 }
      );
    }

    if (action === "checkout") {
      const document = engine.checkOutDocument({
        organizationId: gate.organizationId,
        userId,
        documentId: body.documentId,
      });
      return jsonOk({ document }, { correlationId: gate.correlationId });
    }

    if (action === "checkin") {
      const document = engine.checkInDocument({
        organizationId: gate.organizationId,
        userId,
        documentId: body.documentId,
        content: body.content,
        changeNote: body.changeNote,
      });
      return jsonOk({ document }, { correlationId: gate.correlationId });
    }

    if (action === "archive") {
      const document = engine.archiveDocument({
        organizationId: gate.organizationId,
        documentId: body.documentId,
      });
      return jsonOk({ document }, { correlationId: gate.correlationId });
    }

    if (action === "restore") {
      const document = engine.restoreDocument({
        organizationId: gate.organizationId,
        documentId: body.documentId,
      });
      return jsonOk({ document }, { correlationId: gate.correlationId });
    }

    if (action === "classify") {
      const document = engine.classifyDocument({
        organizationId: gate.organizationId,
        userId,
        documentId: body.documentId,
      });
      return jsonOk({ document }, { correlationId: gate.correlationId });
    }

    if (action === "ocr") {
      const ocr = engine.runOcr({
        organizationId: gate.organizationId,
        userId,
        documentId: body.documentId,
      });
      return jsonOk({ ocr }, { correlationId: gate.correlationId });
    }

    if (action === "extract") {
      const entities = engine.extractEntities({
        organizationId: gate.organizationId,
        userId,
        documentId: body.documentId,
      });
      return jsonOk({ entities }, { correlationId: gate.correlationId });
    }

    return jsonError(JagErrors.validation(`Unknown action: ${action}`));
  } catch (e) {
    return jsonError(
      JagErrors.validation(e instanceof Error ? e.message : "knowledge error")
    );
  }
}
