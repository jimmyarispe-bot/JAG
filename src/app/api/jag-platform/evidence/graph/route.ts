import { NextResponse } from "next/server";
import {
  canAccessEvidenceOrganization,
  isKnowledgeGraphNodeType,
  isKnowledgeGraphRelationshipType,
  knowledgeGraphSummary,
  queryKnowledgeGraph,
} from "@/lib/evidence-center";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

/** GET — graph snapshot (nodes, edges, summary) for the organization. */
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
  const relationshipType = searchParams.get("relationshipType") ?? "";
  const graph = queryKnowledgeGraph({
    organizationId,
    nodeType:
      nodeType && isKnowledgeGraphNodeType(nodeType) ? nodeType : "",
    relationshipType:
      relationshipType && isKnowledgeGraphRelationshipType(relationshipType)
        ? relationshipType
        : "",
  });

  return NextResponse.json({
    ok: true,
    ...graph,
    summary: knowledgeGraphSummary(organizationId),
  });
}
