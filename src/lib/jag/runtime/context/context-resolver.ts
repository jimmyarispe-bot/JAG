import type { RuntimeIdentity } from "../contracts/identity";
import { RuntimeContextError } from "../errors";
import type { ContextProvider } from "./context-provider";
import type {
  AvailableContext,
  ContextSelection,
  ContextSnapshot,
} from "./context-types";

export interface ContextResolver {
  mergeAvailable(
    identity: RuntimeIdentity,
    contributions: readonly AvailableContext[]
  ): AvailableContext[];
  buildSnapshot(input: {
    identity: RuntimeIdentity;
    available: readonly AvailableContext[];
    selection?: ContextSelection;
    parent?: ContextSnapshot | null;
    mode: "persistent" | "temporary";
    now: string;
  }): ContextSnapshot;
  inherit(
    parent: ContextSnapshot,
    child: ContextSnapshot
  ): ContextSnapshot;
}

/**
 * Merges provider contributions and applies generic inheritance.
 * Inheritance is structural (parent → child), never domain-aware.
 */
export class DefaultContextResolver implements ContextResolver {
  mergeAvailable(
    identity: RuntimeIdentity,
    contributions: readonly AvailableContext[]
  ): AvailableContext[] {
    const byId = new Map<string, AvailableContext>();
    for (const item of contributions) {
      if (item.organizationId !== identity.activeOrganizationId) {
        // Allow listing other orgs only when identity is a member.
        const member = identity.orgAssignments.some(
          (a) => a.organizationId === item.organizationId
        );
        if (!member) continue;
      }
      if (item.requiredPermissions?.length) {
        const allowed = item.requiredPermissions.every((p) =>
          identity.permissions.includes(p)
        );
        if (!allowed) continue;
      }
      const prev = byId.get(item.contextId);
      if (!prev || (item.priority ?? 0) >= (prev.priority ?? 0)) {
        byId.set(item.contextId, item);
      }
    }
    return [...byId.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  buildSnapshot(input: {
    identity: RuntimeIdentity;
    available: readonly AvailableContext[];
    selection?: ContextSelection;
    parent?: ContextSnapshot | null;
    mode: "persistent" | "temporary";
    now: string;
  }): ContextSnapshot {
    const { identity, available, selection, parent, mode, now } = input;

    let profile: AvailableContext | undefined;
    if (selection?.contextId) {
      profile = available.find((a) => a.contextId === selection.contextId);
      if (!profile) {
        throw new RuntimeContextError(
          `Unknown or unauthorized context: ${selection.contextId}`,
          { code: "CONTEXT_NOT_AVAILABLE" }
        );
      }
    } else if (selection?.legacySurfaceId) {
      profile = available.find(
        (a) => a.legacySurfaceId === selection.legacySurfaceId
      );
    } else if (parent) {
      profile = available.find((a) => a.contextId === parent.contextId);
    }

    if (!profile && available.length > 0) {
      profile = available[0];
    }

    if (!profile) {
      throw new RuntimeContextError("No available context", {
        code: "CONTEXT_EMPTY",
      });
    }

    const base: ContextSnapshot = {
      contextId: profile.contextId,
      contextFamily: profile.contextFamily,
      organizationId: profile.organizationId,
      workspaceId: selection?.workspaceId,
      focusObject: selection?.focusObject,
      workflowRef: selection?.workflowRef,
      activeTaskRef: selection?.activeTaskRef,
      temporal: selection?.temporal,
      collaborative: selection?.collaborative,
      domainHints: [...(profile.domainHints ?? [])],
      mode,
      parentContextId: profile.parentContextId ?? parent?.contextId,
      inheritedFrom: profile.parentContextId ?? parent?.contextId,
      legacySurfaceId:
        selection?.legacySurfaceId ?? profile.legacySurfaceId,
      depth: 0,
      attributes: {
        ...(profile.attributes ?? {}),
        ...(selection?.attributes ?? {}),
      },
      resolvedAt: now,
    };

    if (parent && profile.parentContextId === parent.contextId) {
      return this.inherit(parent, base);
    }

    if (profile.parentContextId) {
      const parentProfile = available.find(
        (a) => a.contextId === profile!.parentContextId
      );
      if (parentProfile) {
        const syntheticParent = this.buildSnapshot({
          identity,
          available,
          selection: { contextId: parentProfile.contextId },
          mode: "persistent",
          now,
        });
        return this.inherit(syntheticParent, base);
      }
    }

    return base;
  }

  inherit(parent: ContextSnapshot, child: ContextSnapshot): ContextSnapshot {
    return {
      ...child,
      organizationId: child.organizationId || parent.organizationId,
      workspaceId: child.workspaceId ?? parent.workspaceId,
      focusObject: child.focusObject ?? parent.focusObject,
      workflowRef: child.workflowRef ?? parent.workflowRef,
      activeTaskRef: child.activeTaskRef ?? parent.activeTaskRef,
      temporal: child.temporal ?? parent.temporal,
      collaborative: child.collaborative ?? parent.collaborative,
      domainHints: uniqueStrings([
        ...parent.domainHints,
        ...child.domainHints,
      ]),
      partyRefs: mergeRefs(parent.partyRefs, child.partyRefs),
      inheritedFrom: parent.contextId,
      parentContextId: parent.contextId,
      depth: parent.depth + 1,
      attributes: {
        ...(parent.attributes ?? {}),
        ...(child.attributes ?? {}),
      },
    };
  }
}

export function createContextResolver(): ContextResolver {
  return new DefaultContextResolver();
}

/** Apply provider enrich hooks in priority order. */
export async function applyProviderEnrichment(
  providers: readonly ContextProvider[],
  identity: RuntimeIdentity,
  snapshot: ContextSnapshot,
  selection?: ContextSelection
): Promise<ContextSnapshot> {
  let current = snapshot;
  for (const provider of providers) {
    if (!provider.enrich) continue;
    current = await provider.enrich(identity, current, selection);
  }
  return current;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function mergeRefs(
  a?: ContextSnapshot["partyRefs"],
  b?: ContextSnapshot["partyRefs"]
): ContextSnapshot["partyRefs"] {
  if (!a?.length && !b?.length) return undefined;
  const map = new Map<string, NonNullable<ContextSnapshot["partyRefs"]>[number]>();
  for (const ref of [...(a ?? []), ...(b ?? [])]) {
    map.set(`${ref.type}:${ref.id}`, ref);
  }
  return [...map.values()];
}
