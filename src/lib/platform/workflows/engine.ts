/**
 * End-to-End Executive Workflow Engine — registry façade (Sprint 018).
 */

import {
  DomainWorkflow,
  createDomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/workflows/domain-workflow";
import { WorkflowPipeline, type WorkflowPipelineDependencies } from "@/lib/platform/workflows/pipeline";
import {
  WORKFLOW_DOMAINS,
  type WorkflowDomain,
  type WorkflowRunRequest,
  type WorkflowRunResult,
} from "@/lib/platform/workflows/types";

export interface ExecutiveWorkflowEngineDependencies
  extends DomainWorkflowDependencies {
  /** Shared pipeline instance for all domain packs. */
  sharedPipeline?: WorkflowPipeline;
}

/**
 * Registry of domain lifecycle workflows backed by one shared pipeline.
 */
export class ExecutiveWorkflowEngine {
  private readonly pipeline: WorkflowPipeline;
  private readonly workflows: ReadonlyMap<WorkflowDomain, DomainWorkflow>;

  constructor(dependencies: ExecutiveWorkflowEngineDependencies = {}) {
    this.pipeline =
      dependencies.sharedPipeline ??
      dependencies.pipeline ??
      new WorkflowPipeline(dependencies);

    const map = new Map<WorkflowDomain, DomainWorkflow>();
    for (const domain of WORKFLOW_DOMAINS) {
      map.set(
        domain,
        createDomainWorkflow(domain, {
          ...dependencies,
          pipeline: this.pipeline,
        })
      );
    }
    this.workflows = map;
  }

  get(domain: WorkflowDomain): DomainWorkflow {
    const workflow = this.workflows.get(domain);
    if (!workflow) {
      throw new Error(`Unknown workflow domain: ${domain}`);
    }
    return workflow;
  }

  listDomains(): readonly WorkflowDomain[] {
    return WORKFLOW_DOMAINS;
  }

  async run(request: WorkflowRunRequest): Promise<WorkflowRunResult> {
    return this.get(request.domain).run(request);
  }
}

/** Factory for a fully wired end-to-end executive workflow engine. */
export function createExecutiveWorkflowEngine(
  dependencies: ExecutiveWorkflowEngineDependencies = {}
): ExecutiveWorkflowEngine {
  return new ExecutiveWorkflowEngine(dependencies);
}

export type { WorkflowPipelineDependencies };
