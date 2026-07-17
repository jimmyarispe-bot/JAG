/**
 * End-to-End Workflow Engine — domain workflow façade.
 *
 * Each domain pack is a thin specialization over {@link WorkflowPipeline}.
 */

import { WorkflowPipeline, type WorkflowPipelineDependencies } from "@/lib/platform/executive-workflows/pipeline";
import { getWorkflowDomainConfig } from "@/lib/platform/executive-workflows/domain-configs";
import type {
  WorkflowDomain,
  WorkflowDomainConfig,
  WorkflowRunRequest,
  WorkflowRunResult,
} from "@/lib/platform/executive-workflows/types";

export interface DomainWorkflowDependencies extends WorkflowPipelineDependencies {
  pipeline?: WorkflowPipeline;
}

/**
 * Domain-scoped end-to-end organizational lifecycle workflow.
 */
export class DomainWorkflow {
  readonly domain: WorkflowDomain;
  readonly config: WorkflowDomainConfig;
  private readonly pipeline: WorkflowPipeline;

  constructor(domain: WorkflowDomain, dependencies: DomainWorkflowDependencies = {}) {
    this.domain = domain;
    this.config = getWorkflowDomainConfig(domain);
    this.pipeline = dependencies.pipeline ?? new WorkflowPipeline(dependencies);
  }

  async run(
    request: Omit<WorkflowRunRequest, "domain"> & { domain?: WorkflowDomain }
  ): Promise<WorkflowRunResult> {
    return this.pipeline.run({
      ...request,
      domain: this.domain,
      subject: request.subject ?? this.config.defaultSubject,
      description: request.description ?? this.config.description,
    });
  }
}

export function createDomainWorkflow(
  domain: WorkflowDomain,
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return new DomainWorkflow(domain, dependencies);
}
