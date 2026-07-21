/**
 * JAG OIOS — OrganizationOperatingSystem façade (Sprint 031).
 *
 * Permanent entry point for organizational intelligence operating-system
 * concerns: bootstrap, compose, and query.
 */

import type {
  OrganizationOperatingSystem as OrganizationOperatingSystemContract,
} from "@/lib/platform/oios/contracts";
import type { OiosEngine } from "@/lib/platform/oios/oios-engine";
import type {
  OiosQueryRequest,
  OiosQueryResult,
  OiosRequest,
  OiosResult,
  OiosScope,
} from "@/lib/platform/oios/types";

export class OrganizationOperatingSystem
  implements OrganizationOperatingSystemContract
{
  constructor(private readonly engine: OiosEngine) {}

  bootstrap(scope?: OiosScope): void {
    for (const domain of this.engine.registry.list()) {
      if (domain.status === "registered") {
        // Future domains remain registered until activated by a sprint.
        continue;
      }
      this.engine.registry.activate(domain.domain);
    }

    if (scope) {
      this.engine.memory.remember({
        id: `bootstrap-${scope.organizationId ?? "org"}`,
        scope,
        kind: "oios.bootstrap",
        content: "Organization Operating System bootstrapped.",
        createdAt: new Date().toISOString(),
        metadata: {},
      });
    }
  }

  build(request: OiosRequest): OiosResult {
    return this.engine.build(request);
  }

  query(result: OiosResult, request: OiosQueryRequest): OiosQueryResult {
    const focus = request.focus ?? "general";
    const projection = this.engine.project(result);
    const answer =
      focus === "health"
        ? `Health is ${result.health.band} (${result.health.score.toFixed(0)}).`
        : focus === "maturity"
          ? `Maturity is ${result.maturity.level} (${result.maturity.score.toFixed(0)}).`
          : focus === "strategy"
            ? `Strategy contains ${result.strategy.objectives.length} objectives across themes: ${result.strategy.themes.join(", ")}.`
            : `${result.historyRecord.summary} ${projection.headline}`;

    return {
      question: request.question,
      answer,
      references: [
        "health",
        "maturity",
        "scorecard",
        "strategy",
        "domains",
        "digital-twin",
        "ecosystem-intelligence",
      ],
    };
  }
}
