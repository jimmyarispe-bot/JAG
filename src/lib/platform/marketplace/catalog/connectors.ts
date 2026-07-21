/**
 * Connector Marketplace — soft-read provider registries (never vendor APIs).
 */

import { CRM_PROVIDERS } from "@/lib/platform/integrations/connectors/crm/entities";
import { HR_PROVIDERS } from "@/lib/platform/integrations/connectors/hr/entities";
import { FINANCE_PROVIDERS } from "@/lib/platform/integrations/connectors/finance/entities";
import { EDUCATION_PROVIDERS } from "@/lib/platform/integrations/connectors/education/entities";
import { ENTERPRISE_PROVIDERS } from "@/lib/platform/integrations/connectors/enterprise/entities";
import { COLLABORATION_PROVIDERS } from "@/lib/platform/integrations/connectors/collaboration/entities";
import type { MarketplaceListing } from "@/lib/platform/marketplace/types";
import { MARKETPLACE_VERSION } from "@/lib/platform/marketplace/types";

type DomainProvider = {
  domain: string;
  providers: readonly string[];
  tags: string[];
};

const DOMAINS: DomainProvider[] = [
  { domain: "crm", providers: CRM_PROVIDERS, tags: ["crm", "sales"] },
  { domain: "hr", providers: HR_PROVIDERS, tags: ["hr", "people"] },
  { domain: "finance", providers: FINANCE_PROVIDERS, tags: ["finance", "payments"] },
  { domain: "education", providers: EDUCATION_PROVIDERS, tags: ["education", "sis"] },
  { domain: "enterprise", providers: ENTERPRISE_PROVIDERS, tags: ["gov", "enterprise"] },
  { domain: "collaboration", providers: COLLABORATION_PROVIDERS, tags: ["collaboration", "comms"] },
  {
    domain: "workspace",
    providers: ["google_workspace", "microsoft_365"] as const,
    tags: ["workspace", "productivity"],
  },
];

function titleCase(provider: string): string {
  return provider
    .split(/[_-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function buildConnectorMarketplaceListings(): MarketplaceListing[] {
  const listings: MarketplaceListing[] = [];
  for (const domain of DOMAINS) {
    for (const provider of domain.providers) {
      listings.push({
        id: `mp-conn-${provider}`,
        key: `connector.${provider}`,
        category: "connectors",
        name: `${titleCase(provider)} Connector`,
        description: `Canonical ${domain.domain} connector for ${titleCase(provider)}. Normalizes to platform entities; intelligence soft-reads feeds only.`,
        version: MARKETPLACE_VERSION,
        publisher: "JAG Platform",
        status: "certified",
        tags: [...domain.tags, provider, "connector"],
        sourceSystem: `connectors/${domain.domain}`,
        pricing: "included",
        certified: true,
        capabilities: ["connect", "sync", "normalize", "executive_feed"],
        meta: { domain: domain.domain, provider },
      });
    }
  }
  return listings;
}
