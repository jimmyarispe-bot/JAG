import {
  ACADEMYOS_APPLICATION_KEY,
  PLATFORM_APPLICATION_CATALOG,
  PLATFORM_NAME,
} from "@/lib/platform/applications/catalog";
import type {
  FounderApplicationSummary,
  FounderNavNode,
  FounderNavScope,
  FounderOrganizationSummary,
} from "@/lib/platform/founder/types";

/** Platform → application → organization drill paths (Founder Workspace UI). */
export const FOUNDER_PLATFORM_HOME = "/founder" as const;
/** Deep-link into AcademyOS application home (not used for explorer drill). */
export const FOUNDER_ACADEMYOS_HOME = "/dashboard" as const;

export function resolveFounderNavScope(input: {
  organizationId?: string | null;
  applicationKey?: string | null;
}): FounderNavScope {
  const app = input.applicationKey?.trim() || null;
  const org = input.organizationId?.trim() || null;
  if (app && org) {
    return {
      kind: "application_organization",
      applicationKey: app,
      organizationId: org,
    };
  }
  if (app) return { kind: "application", applicationKey: app };
  if (org) return { kind: "organization", organizationId: org };
  return { kind: "platform" };
}

export function scopeToHref(scope: FounderNavScope): string {
  switch (scope.kind) {
    case "platform":
      return FOUNDER_PLATFORM_HOME;
    case "application":
      return `${FOUNDER_PLATFORM_HOME}?application=${encodeURIComponent(scope.applicationKey)}`;
    case "organization":
      return `${FOUNDER_PLATFORM_HOME}?organization=${encodeURIComponent(scope.organizationId)}`;
    case "application_organization": {
      const params = new URLSearchParams({
        organization: scope.organizationId,
        application: scope.applicationKey,
      });
      return `${FOUNDER_PLATFORM_HOME}?${params.toString()}`;
    }
  }
}

/**
 * Build navigation tree: Platform → Applications → Organizations.
 * Functional for cross-org drill; UI may consume later without changing this shape.
 */
export function buildFounderNavigation(input: {
  organizations: FounderOrganizationSummary[];
  applications: FounderApplicationSummary[];
  activeScope?: FounderNavScope;
}): FounderNavNode[] {
  const appNodes: FounderNavNode[] = input.applications.map((app) => {
    const orgChildren = input.organizations
      .filter((org) => org.enabledApplicationKeys.includes(app.key))
      .map((org) => ({
        id: `app:${app.key}:org:${org.id}`,
        label: org.name,
        href: scopeToHref({
          kind: "application_organization",
          applicationKey: app.key,
          organizationId: org.id,
        }),
        scope: {
          kind: "application_organization" as const,
          applicationKey: app.key,
          organizationId: org.id,
        },
      }));

    return {
      id: `app:${app.key}`,
      label: app.name,
      href: scopeToHref({ kind: "application", applicationKey: app.key }),
      scope: { kind: "application" as const, applicationKey: app.key },
      children: orgChildren,
    };
  });

  const orgNodes: FounderNavNode[] = input.organizations.map((org) => ({
    id: `org:${org.id}`,
    label: org.name,
    href: scopeToHref({ kind: "organization", organizationId: org.id }),
    scope: { kind: "organization" as const, organizationId: org.id },
  }));

  return [
    {
      id: "platform",
      label: PLATFORM_NAME,
      href: FOUNDER_PLATFORM_HOME,
      scope: { kind: "platform" },
      children: [
        {
          id: "applications",
          label: "Applications",
          href: FOUNDER_PLATFORM_HOME,
          scope: { kind: "platform" },
          children: appNodes.length
            ? appNodes
            : [
                {
                  id: `app:${ACADEMYOS_APPLICATION_KEY}`,
                  label:
                    PLATFORM_APPLICATION_CATALOG.find(
                      (a) => a.key === ACADEMYOS_APPLICATION_KEY
                    )?.name ?? "AcademyOS",
                  href: FOUNDER_ACADEMYOS_HOME,
                  scope: {
                    kind: "application",
                    applicationKey: ACADEMYOS_APPLICATION_KEY,
                  },
                },
              ],
        },
        {
          id: "organizations",
          label: "Organizations",
          href: FOUNDER_PLATFORM_HOME,
          scope: { kind: "platform" },
          children: orgNodes,
        },
      ],
    },
  ];
}

export function findNavNode(
  roots: FounderNavNode[],
  predicate: (node: FounderNavNode) => boolean
): FounderNavNode | null {
  for (const node of roots) {
    if (predicate(node)) return node;
    if (node.children?.length) {
      const hit = findNavNode(node.children, predicate);
      if (hit) return hit;
    }
  }
  return null;
}
