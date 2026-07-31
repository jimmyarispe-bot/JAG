/**
 * Evolution proposal generator — evidence-backed; never mutates production code.
 */

import { randomUUID } from "node:crypto";
import type {
  ArchitectureReview,
  EvolutionCaptureRequest,
  EvolutionClassification,
  EvolutionProposal,
  EvolutionUnderstanding,
  PriorityScores,
  RepositoryAnalysis,
} from "../types";
import { formatTeachJagMessage } from "../automation/mr-jag-response";
import { upsertProposal } from "../store";
import { upsertRequest } from "../store";

function effortLabel(priority: PriorityScores): string {
  if (priority.engineeringEffort >= 70) return "L (multi-sprint)";
  if (priority.engineeringEffort >= 45) return "M (1–2 sprints)";
  return "S (days)";
}

function packagesFor(
  classification: EvolutionClassification,
  architecture: ArchitectureReview,
  request: EvolutionCaptureRequest
): readonly string[] {
  const pkgs = new Set<string>();
  if (request.product) pkgs.add(request.product);
  switch (architecture.primaryLayer) {
    case "AcademyOS":
      pkgs.add("packages/academyos");
      break;
    case "Platform":
    case "Shared Service":
      pkgs.add("packages/platform");
      break;
    case "Documentation":
      pkgs.add("docs/");
      break;
    case "Training":
      pkgs.add("packages/platform/mr-jag");
      pkgs.add("docs/platform/mr-jag");
      break;
    case "Foundation":
      pkgs.add("packages/foundation (proposal only — no direct edits)");
      break;
    default:
      pkgs.add("packages/platform/evolution");
  }
  if (classification === "Platform Enhancement (PER)") {
    pkgs.add("docs/platform (PER)");
    pkgs.add("Studio PER review");
  }
  return Object.freeze([...pkgs]);
}

export function generateEvolutionProposal(input: {
  request: EvolutionCaptureRequest;
  understanding: EvolutionUnderstanding;
  repository: RepositoryAnalysis;
  architecture: ArchitectureReview;
  classification: EvolutionClassification;
  priority: PriorityScores;
}): EvolutionProposal {
  const { request, understanding, repository, architecture, classification, priority } =
    input;

  let status: EvolutionProposal["status"] = "proposal_ready";
  if (repository.duplicateRequest) status = "duplicate";
  else if (repository.alreadyExists) status = "in_review";

  const reusable = repository.hits
    .filter((h) => h.score >= 20)
    .slice(0, 5)
    .map((h) => `${h.kind}:${h.id}`);

  const recommendation = repository.duplicateRequest
    ? "Link to the existing Evolution request; do not open a parallel workstream."
    : repository.alreadyExists
      ? "Point the user to the existing capability; improve discoverability/docs if needed."
      : classification === "Platform Enhancement (PER)"
        ? "Route as a Platform Enhancement Request for Studio governance review."
        : "Advance as a governed Evolution Proposal — no production code changes from this engine.";

  const proposal: EvolutionProposal = {
    proposalId: `prop:${randomUUID()}`,
    requestId: request.requestId,
    classification,
    status,
    executiveSummary: `${classification}: ${request.title}`,
    problemStatement: understanding.businessProblem,
    recommendedSolution: repository.alreadyExists
      ? `Reuse or surface existing capability. Evidence: ${repository.summary}`
      : `Design a ${classification.toLowerCase()} that addresses "${understanding.desiredOutcome}" within the ${architecture.primaryLayer} layer, reusing ${reusable[0] ?? "shared platform patterns"} where possible.`,
    alternativeSolutions: Object.freeze([
      "Improve documentation / training only",
      "Organization configuration without product change",
      "Defer pending duplicate consolidation",
    ]),
    affectedPackages: packagesFor(classification, architecture, request),
    reusableComponents: Object.freeze(reusable),
    estimatedEffort: effortLabel(priority),
    risks: Object.freeze([
      "Scope creep beyond architecture layer",
      "Bypassing Studio release gates (forbidden)",
      repository.duplicateRequest
        ? "Duplicate demand splitting engineering focus"
        : "Underestimated cross-package impact",
    ]),
    requiredTests: Object.freeze([
      "Unit: capture → classify → proposal pipeline",
      "Regression: Platform / Studio / AcademyOS / Mr. JAG suites",
      classification === "Bug Fix"
        ? "Reproduction + fix verification"
        : "Proposal artifact schema validation",
    ]),
    documentationUpdates: Object.freeze([
      "docs/platform/evolution/ proposal record",
      classification === "Platform Enhancement (PER)"
        ? "PER entry via Studio PER process"
        : "Feature/docs update if approved later",
    ]),
    releaseImpact:
      classification === "Documentation Improvement" ||
      classification === "Training Improvement"
        ? "Docs/training only — no runtime release gate change"
        : "Requires Studio review and certified release if approved for implementation",
    confidenceScore: Math.round(
      (understanding.confidence + priority.confidence) / 2
    ),
    recommendation,
    architecture,
    understanding,
    repository,
    priority,
    mrJagMessage: formatTeachJagMessage({
      classification,
      repository,
      status,
    }),
    createdAt: new Date().toISOString(),
    generatesProductionCode: false,
    requiresStudioApproval: true,
  };

  upsertProposal(proposal);
  upsertRequest({ ...request, status });
  return proposal;
}
