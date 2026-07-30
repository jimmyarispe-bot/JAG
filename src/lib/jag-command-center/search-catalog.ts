/**
 * Global Command Center search catalog — application layer only.
 */

import { cache } from "react";
import {
  EDUCATION_DOMAIN_ID,
  EDUCATION_DOMAIN_NAME,
  listCapabilityPacks,
} from "@/lib/domains/education";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { listBriefings } from "./briefing-engine/store";
import { loadDecisionCenter } from "./decision-center/query";
import { listLoadedDomains } from "./domains";
import { listStoredExecutionsForOrganizations } from "./intelligence-store";
import type { JagSearchItem } from "./search-filter";

export type { JagSearchItem, JagSearchItemKind } from "./search-filter";
export { filterJagSearchCatalog } from "./search-filter";

/** Mirror of Command Center nav — kept in lib to avoid UI→lib cycles. */
const NAV_SEED: readonly { id: string; label: string; href: string }[] = [
  { id: "overview", label: "Overview", href: "/jag" },
  { id: "chat", label: "Conversation", href: "/jag/chat" },
  { id: "decisions", label: "Decision Center", href: "/jag/decisions" },
  { id: "briefings", label: "Executive Briefings", href: "/jag/briefings" },
  { id: "scenarios", label: "Scenario Planner", href: "/jag/scenarios" },
  { id: "memory", label: "Organizational Memory", href: "/jag/memory" },
  { id: "strategy", label: "Strategic Intelligence", href: "/jag/strategy" },
  { id: "inbox", label: "Executive Inbox", href: "/jag/inbox" },
  { id: "organizations", label: "Organizations", href: "/jag/organizations" },
  { id: "domains", label: "Domains", href: "/jag/domains" },
  {
    id: "capability-packs",
    label: "Capability Packs",
    href: "/jag/capability-packs",
  },
  { id: "knowledge", label: "Knowledge", href: "/jag/knowledge" },
  { id: "policies", label: "Policies", href: "/jag/policies" },
  {
    id: "intelligence-graph",
    label: "Intelligence Graph",
    href: "/jag/intelligence-graph",
  },
  { id: "observability", label: "Observability", href: "/jag/observability" },
  { id: "runtime", label: "Runtime", href: "/jag/runtime" },
  { id: "settings", label: "Settings", href: "/jag/settings" },
];

export const loadJagSearchCatalog = cache(function loadJagSearchCatalog(
  session: JagPlatformSession
): readonly JagSearchItem[] {
  const items: JagSearchItem[] = [];

  for (const nav of NAV_SEED) {
    items.push({
      id: `nav:${nav.id}`,
      kind: "navigation",
      title: nav.label,
      subtitle: "Navigation",
      href: nav.href,
    });
  }

  const orgs = listOrganizationsForSession(session);
  for (const org of orgs) {
    items.push({
      id: `org:${org.id}`,
      kind: "organization",
      title: org.name,
      subtitle: "Organization",
      href: `/jag/organizations?org=${encodeURIComponent(org.id)}`,
    });
  }

  for (const domain of listLoadedDomains()) {
    items.push({
      id: `domain:${domain.id}`,
      kind: "domain",
      title: domain.name,
      subtitle: `Domain · ${domain.status}`,
      href: "/jag/domains",
    });
  }

  items.push({
    id: `domain:${EDUCATION_DOMAIN_ID}`,
    kind: "domain",
    title: EDUCATION_DOMAIN_NAME,
    subtitle: "Domain",
    href: "/jag/domains",
  });

  for (const pack of listCapabilityPacks()) {
    items.push({
      id: `pack:${pack.id}`,
      kind: "capability_pack",
      title: pack.name,
      subtitle: `Capability Pack · v${pack.version}`,
      href: "/jag/capability-packs",
    });
  }

  const decisions = loadDecisionCenter(session, {}).decisions;
  for (const d of decisions.slice(0, 80)) {
    items.push({
      id: `decision:${d.id}`,
      kind: "decision",
      title: d.title,
      subtitle: `${d.status} · ${d.organizationName} · ${d.priority}`,
      href: `/jag/decisions/${d.id}`,
    });
  }

  for (const b of listBriefings({ limit: 40 })) {
    items.push({
      id: `briefing:${b.id}`,
      kind: "briefing",
      title: b.title,
      subtitle: `${b.kindLabel} · ${b.organizationName}`,
      href: `/jag/briefings/${b.id}`,
    });
  }

  const orgIds = orgs.map((o) => o.id);
  const executions = listStoredExecutionsForOrganizations(orgIds, 80);
  const seenContributors = new Set<string>();
  for (const e of executions) {
    if (seenContributors.has(e.contributorId)) continue;
    seenContributors.add(e.contributorId);
    items.push({
      id: `contributor:${e.contributorId}`,
      kind: "contributor",
      title: e.label,
      subtitle: e.contributorId,
      href: "/jag/intelligence-graph",
    });
  }

  items.push(
    {
      id: "knowledge:model",
      kind: "knowledge",
      title: "Education Knowledge Model",
      subtitle: "Knowledge",
      href: "/jag/knowledge",
    },
    {
      id: "policy:registry",
      kind: "policy",
      title: "Education Policy Registry",
      subtitle: "Policies",
      href: "/jag/policies",
    }
  );

  return items;
});
