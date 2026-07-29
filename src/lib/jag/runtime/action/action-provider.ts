import type { RuntimeActionResult } from "./action-result";
import type {
  ActionCatalogEntry,
  ActionExecutionRequest,
} from "./action-types";

/**
 * Domain / Core action adapter — registered only, never imported by Core.
 * Implementations live outside this package.
 */
export interface ActionProvider {
  id: string;
  /** Action ids this provider handles. */
  actionIds: readonly string[];
  /** Optional catalog contributions for those actions. */
  catalog?: readonly ActionCatalogEntry[];
  priority?: number;
  supports?(request: ActionExecutionRequest): boolean;
  /**
   * Execute the action. Read/write happens inside the provider adapter —
   * Action Runtime does not mutate domain models.
   */
  execute(
    request: ActionExecutionRequest
  ): Promise<ActionProviderResult> | ActionProviderResult;
  undo?(
    request: ActionExecutionRequest,
    undoToken: string
  ): Promise<ActionProviderResult> | ActionProviderResult;
}

/** Provider-local result before Runtime wraps audit id / defaults. */
export interface ActionProviderResult {
  status: RuntimeActionResult["status"];
  domainPackageId?: string;
  workflowInstanceId?: string;
  evidenceRefs?: RuntimeActionResult["evidenceRefs"];
  memoryRefs?: RuntimeActionResult["memoryRefs"];
  twinRefs?: RuntimeActionResult["twinRefs"];
  undoToken?: string;
  error?: { code: string; message: string };
  attributes?: Readonly<Record<string, unknown>>;
}

export function sortActionProviders(
  providers: readonly ActionProvider[]
): ActionProvider[] {
  return [...providers].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
