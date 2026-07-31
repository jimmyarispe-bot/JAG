/**
 * Mr. JAG Teach-JAG response phrases — lives in Evolution (does not modify Help/Academy/Coach).
 */

import type {
  EvolutionClassification,
  EvolutionProposal,
  RepositoryAnalysis,
} from "../types";

export function formatTeachJagMessage(input: {
  classification: EvolutionClassification;
  repository: RepositoryAnalysis;
  status: EvolutionProposal["status"];
}): string {
  const lines = [
    "I understand your request.",
    "I searched the platform.",
  ];

  if (input.repository.duplicateRequest) {
    lines.push(
      `This appears to duplicate an existing Evolution request (${input.repository.duplicateOfRequestId}).`
    );
    return lines.join(" ");
  }

  if (input.repository.alreadyExists) {
    const hit = input.repository.hits[0];
    lines.push(
      hit
        ? `This capability already exists… see ${hit.kind} “${hit.title}”.`
        : "This capability already exists…"
    );
    return lines.join(" ");
  }

  if (input.classification === "Platform Enhancement (PER)") {
    lines.push("This appears to be a Platform Enhancement Request.");
    lines.push("I created an Evolution Proposal for Studio governance review.");
    return lines.join(" ");
  }

  lines.push("I created an Evolution Proposal.");
  return lines.join(" ");
}
