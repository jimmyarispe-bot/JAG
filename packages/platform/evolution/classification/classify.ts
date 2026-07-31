/**
 * Classification — exactly one Evolution classification per request.
 */

import type {
  ArchitectureReview,
  EvolutionClassification,
  EvolutionUnderstanding,
  RepositoryAnalysis,
} from "../types";

export function classifyEvolution(input: {
  understanding: EvolutionUnderstanding;
  repository: RepositoryAnalysis;
  architecture: ArchitectureReview;
}): EvolutionClassification {
  const cat = input.understanding.categoryHint;
  const layer = input.architecture.primaryLayer;
  const text =
    `${input.understanding.intent} ${input.understanding.desiredOutcome}`.toLowerCase();

  // Order matters — exactly one classification.
  if (layer === "Bug" || cat === "defect") return "Bug Fix";
  if (layer === "Documentation" || cat === "documentation") {
    return "Documentation Improvement";
  }
  if (layer === "Training" || cat === "training") {
    return "Training Improvement";
  }
  if (
    cat === "innovation" ||
    /\b(innov|breakthrough|new product|moonshot|ai agent swarm)\b/.test(text)
  ) {
    return "Innovation Proposal";
  }
  if (
    /\b(just for me|my personal|personal automation)\b/.test(text) ||
    (layer === "Automation" && /\bfor me\b/.test(text))
  ) {
    return "Personal Automation";
  }
  if (
    layer === "Configuration" ||
    cat === "configuration" ||
    /\b(for my (org|organization|school)|our settings|org-wide)\b/.test(text)
  ) {
    return "Organization Configuration";
  }
  if (layer === "Automation" || cat === "automation") {
    return "Personal Automation";
  }
  if (
    layer === "AcademyOS" ||
    layer === "Industry Pack" ||
    layer === "Connector" ||
    /\b(academyos|school product|admissions module|product enhancement)\b/.test(
      text
    )
  ) {
    return "Product Enhancement";
  }
  if (
    layer === "Foundation" ||
    layer === "Platform" ||
    layer === "Shared Service" ||
    cat === "platform" ||
    /\b(platform|per|shared service|foundation|sdk)\b/.test(text)
  ) {
    return "Platform Enhancement (PER)";
  }
  return "Product Enhancement";
}
