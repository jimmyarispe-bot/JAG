/**
 * Customer Intelligence — CustomerIntelligenceService (Sprint 039).
 *
 * Public façade over CustomerIntelligenceEngine with repository accessors.
 */

import type {
  CustomerDependencies,
  CustomerIntelligenceService as CustomerIntelligenceServiceContract,
  CustomerRepository as CustomerRepositoryContract,
} from "@/lib/platform/intelligence/customer/contracts";
import {
  CustomerIntelligenceEngineImpl,
  type CustomerIntelligenceEngine,
} from "@/lib/platform/intelligence/customer/customer-engine";
import type {
  CustomerQueryRequest,
  CustomerQueryResult,
  CustomerRequest,
  CustomerResult,
} from "@/lib/platform/intelligence/customer/types";

export interface CustomerServiceDependencies extends CustomerDependencies {
  engine?: CustomerIntelligenceEngine;
}

/**
 * CustomerIntelligenceService — Sprint 039 service entry point.
 */
export class CustomerIntelligenceServiceImpl
  implements CustomerIntelligenceServiceContract
{
  private readonly engine: CustomerIntelligenceEngineImpl;

  constructor(dependencies: CustomerServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as CustomerIntelligenceEngineImpl | undefined) ??
      new CustomerIntelligenceEngineImpl(dependencies);
  }

  build(request: CustomerRequest): CustomerResult {
    return this.engine.build(request);
  }

  query(
    result: CustomerResult,
    request: CustomerQueryRequest
  ): CustomerQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): CustomerRepositoryContract {
    return this.engine.repository;
  }
}

/** Aliases matching Sprint naming. */
export { CustomerIntelligenceServiceImpl as CustomerIntelligenceService };
export { CustomerIntelligenceServiceImpl as CustomerService };
export { CustomerIntelligenceServiceImpl as CustomerServiceImpl };
