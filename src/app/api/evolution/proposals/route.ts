import { createEvolutionEngine } from "@evolution";
import { installMrJag } from "@mr-jag";
import { jsonError, jsonOk, JagErrors, requireEvolutionOrg, requireEvolutionOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireEvolutionOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const engine = createEvolutionEngine();
  const proposalId = searchParams.get("proposalId");
  const requestId = searchParams.get("requestId");
  if (proposalId) {
    return jsonOk(
      { proposal: engine.getProposal(proposalId) },
      { correlationId: gate.correlationId }
    );
  }
  if (requestId) {
    return jsonOk(
      { proposal: engine.getProposalByRequest(requestId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      proposals: engine.listProposals({
        organizationId: gate.organizationId,
        classification: searchParams.get("classification") ?? undefined,
        status: (searchParams.get("status") as never) ?? undefined,
        limit: Number(searchParams.get("limit") ?? 50) || 50,
      }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    requestId?: string;
    action?: "analyze" | "status";
    status?: "in_review" | "implemented" | "rejected" | "duplicate" | "proposal_ready";
    proposalId?: string;
  };
  const gate = await requireEvolutionOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createEvolutionEngine();

  if (body.action === "status" && body.proposalId && body.status) {
    const updated = engine.setProposalStatus(body.proposalId, body.status);
    if ("error" in updated) {
      return jsonError(JagErrors.validation(updated.error));
    }
    return jsonOk(
      { proposal: updated },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const proposal = engine.analyzeAndPropose({
    requestId: body.requestId ?? "",
    includeGraph: false,
  });
  if ("error" in proposal) {
    return jsonError(JagErrors.validation(proposal.error));
  }
  return jsonOk(
    {
      proposal,
      mrJagMessage: proposal.mrJagMessage,
      generatesProductionCode: false,
      requiresStudioApproval: true,
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
