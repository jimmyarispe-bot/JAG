import { NextResponse } from "next/server";
import {
  canAccessEvidenceOrganization,
  createKnowledgeGraphEdge,
  isKnowledgeGraphRelationshipType,
  queryKnowledgeGraph,
  removeKnowledgeGraphEdge,
  updateKnowledgeGraphEdge,
} from "@/lib/evidence-center";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function GET(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") ?? "";
  if (!organizationId || !canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  const relationshipType = searchParams.get("relationshipType") ?? "";
  const { edges } = queryKnowledgeGraph({
    organizationId,
    relationshipType:
      relationshipType && isKnowledgeGraphRelationshipType(relationshipType)
        ? relationshipType
        : "",
  });

  return NextResponse.json({ ok: true, edges });
}

export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    organizationId?: string;
    fromNodeId?: string;
    toNodeId?: string;
    relationshipType?: string;
    metadata?: Record<string, string>;
  };
  const organizationId = body.organizationId ?? "";
  if (!organizationId || !canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }
  if (
    !body.fromNodeId ||
    !body.toNodeId ||
    !body.relationshipType ||
    !isKnowledgeGraphRelationshipType(body.relationshipType)
  ) {
    return NextResponse.json(
      { ok: false, error: "fromNodeId, toNodeId, and relationshipType are required." },
      { status: 400 }
    );
  }

  const result = createKnowledgeGraphEdge({
    organizationId,
    fromNodeId: body.fromNodeId,
    toNodeId: body.toNodeId,
    relationshipType: body.relationshipType,
    metadata: body.metadata,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, edge: result.edge });
}

export async function PATCH(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    organizationId?: string;
    edgeId?: string;
    relationshipType?: string;
    metadata?: Record<string, string>;
  };
  const organizationId = body.organizationId ?? "";
  if (!organizationId || !canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }
  if (!body.edgeId) {
    return NextResponse.json(
      { ok: false, error: "edgeId is required." },
      { status: 400 }
    );
  }

  const result = updateKnowledgeGraphEdge({
    organizationId,
    edgeId: body.edgeId,
    relationshipType:
      body.relationshipType &&
      isKnowledgeGraphRelationshipType(body.relationshipType)
        ? body.relationshipType
        : undefined,
    metadata: body.metadata,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true, edge: result.edge });
}

export async function DELETE(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") ?? "";
  const edgeId = searchParams.get("edgeId") ?? "";
  if (!organizationId || !canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }
  if (!edgeId) {
    return NextResponse.json(
      { ok: false, error: "edgeId is required." },
      { status: 400 }
    );
  }

  const removed = removeKnowledgeGraphEdge(organizationId, edgeId);
  if (!removed) {
    return NextResponse.json({ ok: false, error: "Edge not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
