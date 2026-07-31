import { NextResponse } from "next/server";
import {
  canAccessEvidenceOrganization,
  isKnowledgeGraphNodeType,
  queryKnowledgeGraph,
  upsertKnowledgeGraphNode,
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

  const nodeType = searchParams.get("nodeType") ?? "";
  const { nodes } = queryKnowledgeGraph({
    organizationId,
    nodeType:
      nodeType && isKnowledgeGraphNodeType(nodeType) ? nodeType : "",
  });

  return NextResponse.json({ ok: true, nodes });
}

export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    organizationId?: string;
    nodeType?: string;
    label?: string;
    externalKey?: string;
    metadata?: Record<string, string>;
  };
  const organizationId = body.organizationId ?? "";
  if (!organizationId || !canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }
  if (!body.nodeType || !isKnowledgeGraphNodeType(body.nodeType)) {
    return NextResponse.json(
      { ok: false, error: "Invalid node type." },
      { status: 400 }
    );
  }
  if (!body.label?.trim() || !body.externalKey?.trim()) {
    return NextResponse.json(
      { ok: false, error: "label and externalKey are required." },
      { status: 400 }
    );
  }

  const node = upsertKnowledgeGraphNode({
    organizationId,
    nodeType: body.nodeType,
    label: body.label.trim(),
    externalKey: body.externalKey.trim(),
    metadata: body.metadata,
  });

  return NextResponse.json({ ok: true, node });
}
