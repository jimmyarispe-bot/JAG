import { RuntimeAuthorizationError } from "../errors";
import type { ActionCatalogEntry, ActionExecutionRequest } from "./action-types";

export interface ActionAuthorizationResult {
  allowed: boolean;
  permission: string;
  reason?: string;
}

/**
 * Permission-only authorization — no role checks, no domain rules.
 */
export class ActionAuthorization {
  authorize(
    request: ActionExecutionRequest,
    catalog: ActionCatalogEntry
  ): ActionAuthorizationResult {
    const permission = catalog.permission;
    const allowed = request.identity.permissions.includes(permission);
    if (!allowed) {
      return {
        allowed: false,
        permission,
        reason: `Missing permission: ${permission}`,
      };
    }

    if (
      request.organizationalContext.organizationId !==
      request.identity.activeOrganizationId
    ) {
      const member = request.identity.orgAssignments.some(
        (a) =>
          a.organizationId ===
          request.organizationalContext.organizationId
      );
      if (!member) {
        return {
          allowed: false,
          permission,
          reason: "Context organization outside identity membership",
        };
      }
    }

    if (catalog.requiresConfirmation && !request.confirmationToken) {
      return {
        allowed: false,
        permission,
        reason: "Confirmation required",
      };
    }

    return { allowed: true, permission };
  }

  assertAuthorized(
    request: ActionExecutionRequest,
    catalog: ActionCatalogEntry
  ): void {
    const result = this.authorize(request, catalog);
    if (!result.allowed) {
      throw new RuntimeAuthorizationError(
        result.reason ?? "Action not authorized",
        {
          code: "ACTION_UNAUTHORIZED",
          stageId: "action",
          details: { actionId: request.actionId, permission: result.permission },
        }
      );
    }
  }
}

export function createActionAuthorization(): ActionAuthorization {
  return new ActionAuthorization();
}
