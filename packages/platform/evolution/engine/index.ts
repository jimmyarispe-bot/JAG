/**
 * EvolutionEngine — governed continuous-improvement intelligence (P-005).
 *
 * Produces proposals only. Never modifies production code or bypasses Studio.
 */

import { analyzeUnderstanding } from "../analysis/understand";
import { getEvolutionAnalytics } from "../analytics/service";
import { EVOLUTION_AUTOMATION_GUARDS } from "../automation";
import {
  captureEvolutionRequest,
  isTeachJagUtterance,
} from "../capture";
import { classifyEvolution } from "../classification/classify";
import { buildEvolutionDashboard } from "../dashboard/build";
import { reviewArchitecture } from "../governance/architecture";
import {
  listInnovationCandidates,
  listPerCandidates,
} from "../innovation";
import { evolutionKnowledgeSummary } from "../knowledge";
import { scorePriority } from "../prioritization/score";
import { generateEvolutionProposal } from "../proposals/generate";
import { analyzeRepository } from "../repository/search";
import {
  getProposal,
  getProposalByRequest,
  getRequest,
  listProposals,
  listRequests,
  upsertProposal,
  upsertRequest,
} from "../store";
import type {
  EvolutionCaptureRequest,
  EvolutionClassification,
  EvolutionProposal,
} from "../types";
import { EVOLUTION_CLASSIFICATIONS } from "../types";

export class EvolutionEngine {
  readonly guards = EVOLUTION_AUTOMATION_GUARDS;
  readonly classifications = EVOLUTION_CLASSIFICATIONS;

  isTeachJagUtterance = isTeachJagUtterance;

  capture(input: {
    text: string;
    organizationId: string;
    userId: string;
    persona?: string | null;
    product?: string | null;
    page?: string | null;
    workflow?: string | null;
    title?: string | null;
  }): EvolutionCaptureRequest {
    return captureEvolutionRequest(input);
  }

  /** Full pipeline: capture → understand → search → classify → prioritize → propose */
  teach(input: {
    text: string;
    organizationId: string;
    userId: string;
    persona?: string | null;
    product?: string | null;
    page?: string | null;
    workflow?: string | null;
    title?: string | null;
    root?: string;
    includeGraph?: boolean;
  }): {
    readonly request: EvolutionCaptureRequest;
    readonly proposal: EvolutionProposal;
    readonly mrJagMessage: string;
  } {
    const request = this.capture(input);
    const proposal = this.analyzeAndPropose({
      requestId: request.requestId,
      root: input.root,
      includeGraph: input.includeGraph,
    });
    if ("error" in proposal) {
      throw new Error(proposal.error);
    }
    return {
      request,
      proposal,
      mrJagMessage: proposal.mrJagMessage,
    };
  }

  analyzeAndPropose(input: {
    requestId: string;
    root?: string;
    includeGraph?: boolean;
  }): EvolutionProposal | { error: string } {
    const request = getRequest(input.requestId);
    if (!request) return { error: "Request not found." };

    upsertRequest({ ...request, status: "analyzing" });

    const understanding = analyzeUnderstanding(request);
    const repository = analyzeRepository({
      request,
      root: input.root,
      includeGraph: input.includeGraph === true,
    });
    const architecture = reviewArchitecture({
      request,
      understanding,
      repository,
    });
    const classification = classifyEvolution({
      understanding,
      repository,
      architecture,
    });
    const priority = scorePriority({
      understanding,
      repository,
      classification,
    });

    return generateEvolutionProposal({
      request,
      understanding,
      repository,
      architecture,
      classification,
      priority,
    });
  }

  classifyOnly(input: {
    requestId: string;
    root?: string;
  }):
    | {
        readonly classification: EvolutionClassification;
        readonly understanding: ReturnType<typeof analyzeUnderstanding>;
        readonly repository: ReturnType<typeof analyzeRepository>;
        readonly architecture: ReturnType<typeof reviewArchitecture>;
      }
    | { error: string } {
    const request = getRequest(input.requestId);
    if (!request) return { error: "Request not found." };
    const understanding = analyzeUnderstanding(request);
    const repository = analyzeRepository({
      request,
      root: input.root,
      includeGraph: false,
    });
    const architecture = reviewArchitecture({
      request,
      understanding,
      repository,
    });
    const classification = classifyEvolution({
      understanding,
      repository,
      architecture,
    });
    return { classification, understanding, repository, architecture };
  }

  priorities(organizationId?: string) {
    return listProposals({ organizationId, limit: 50 }).map((p) =>
      Object.freeze({
        proposalId: p.proposalId,
        title: p.executiveSummary,
        classification: p.classification,
        scores: p.priority,
      })
    );
  }

  listRequests = listRequests;
  listProposals = listProposals;
  getRequest = getRequest;
  getProposal = getProposal;
  getProposalByRequest = getProposalByRequest;

  setProposalStatus(
    proposalId: string,
    status: EvolutionProposal["status"]
  ): EvolutionProposal | { error: string } {
    const existing = getProposal(proposalId);
    if (!existing) return { error: "Proposal not found." };
    const next = upsertProposal({ ...existing, status });
    const req = getRequest(existing.requestId);
    if (req) upsertRequest({ ...req, status });
    return next;
  }

  dashboard = buildEvolutionDashboard;
  analytics = getEvolutionAnalytics;
  knowledge = evolutionKnowledgeSummary;
  innovationCandidates = listInnovationCandidates;
  perCandidates = listPerCandidates;
}

export function createEvolutionEngine(): EvolutionEngine {
  return new EvolutionEngine();
}
