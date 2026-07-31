/**
 * Architecture review — map requests to platform layers without bypassing Studio.
 */

import type {
  ArchitectureLayer,
  ArchitectureReview,
  EvolutionCaptureRequest,
  EvolutionUnderstanding,
  RepositoryAnalysis,
} from "../types";

export function reviewArchitecture(input: {
  request: EvolutionCaptureRequest;
  understanding: EvolutionUnderstanding;
  repository: RepositoryAnalysis;
}): ArchitectureReview {
  const text =
    `${input.request.title} ${input.request.description} ${input.understanding.categoryHint}`.toLowerCase();
  const secondary: ArchitectureLayer[] = [];
  let primary: ArchitectureLayer = "Platform";

  if (/\b(bug|broken|error|fail|crash|incorrect)\b/.test(text)) {
    primary = "Bug";
  } else if (/\b(doc|documentation|readme|guide|help article)\b/.test(text)) {
    primary = "Documentation";
  } else if (/\b(train|tutorial|lesson|academy|walkthrough)\b/.test(text)) {
    primary = "Training";
  } else if (
    /\b(config|setting|preference|toggle|org setting)\b/.test(text) ||
    input.understanding.categoryHint === "configuration"
  ) {
    primary = "Configuration";
  } else if (
    /\b(automat|trigger|schedule|nudge)\b/.test(text) ||
    input.understanding.categoryHint === "automation"
  ) {
    primary = "Automation";
  } else if (/\b(connector|integration|sync|webhook)\b/.test(text)) {
    primary = "Connector";
  } else if (/\b(academyos|school|attendance|enrollment|tuition)\b/.test(text)) {
    primary = "AcademyOS";
    secondary.push("Industry Pack");
  } else if (/\b(foundation|sdk|public contract)\b/.test(text)) {
    primary = "Foundation";
  } else if (/\b(shared service|identity|billing platform)\b/.test(text)) {
    primary = "Shared Service";
  } else if (/\b(pack|industry)\b/.test(text)) {
    primary = "Industry Pack";
  } else {
    primary = "Platform";
  }

  if (input.repository.reusableCapability && primary !== "Bug") {
    secondary.push("Platform");
  }
  if (/\b(doc|train)\b/.test(text) && primary !== "Documentation") {
    secondary.push("Documentation");
  }

  const respectsBoundaries =
    primary !== "Foundation" ||
    /\b(foundation|sdk contract)\b/.test(text);

  return {
    requestId: input.request.requestId,
    primaryLayer: primary,
    secondaryLayers: Object.freeze([...new Set(secondary)]),
    rationale: `Primary layer ${primary} based on intent "${input.understanding.intent}" and repository summary: ${input.repository.summary}`,
    respectsBoundaries,
  };
}
