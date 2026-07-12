/**
 * Human Capital Intelligence — HumanCapitalService (Sprint 032).
 *
 * Public façade over HumanCapitalEngine with repository accessors.
 */

import type {
  HumanCapitalDependencies,
  HumanCapitalService as HumanCapitalServiceContract,
  WorkforceRepository as WorkforceRepositoryContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import {
  HumanCapitalEngine as HumanCapitalEngineImpl,
  type HumanCapitalEngine,
} from "@/lib/platform/intelligence/human-capital/human-capital-engine";
import type {
  HumanCapitalQueryRequest,
  HumanCapitalQueryResult,
  HumanCapitalRequest,
  HumanCapitalResult,
} from "@/lib/platform/intelligence/human-capital/types";

export interface HumanCapitalServiceDependencies
  extends HumanCapitalDependencies {
  engine?: HumanCapitalEngine;
}

/**
 * HumanCapitalService — Sprint 032 service entry point.
 */
export class HumanCapitalServiceImpl implements HumanCapitalServiceContract {
  private readonly engine: HumanCapitalEngineImpl;

  constructor(dependencies: HumanCapitalServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as HumanCapitalEngineImpl | undefined) ??
      new HumanCapitalEngineImpl(dependencies);
  }

  build(request: HumanCapitalRequest): HumanCapitalResult {
    return this.engine.build(request);
  }

  query(
    result: HumanCapitalResult,
    request: HumanCapitalQueryRequest
  ): HumanCapitalQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): WorkforceRepositoryContract {
    return this.engine.repository;
  }
}

/** Alias matching Sprint naming. */
export { HumanCapitalServiceImpl as HumanCapitalService };
