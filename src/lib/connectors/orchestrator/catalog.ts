/**
 * ConnectorCatalog™ — master list of every connector The JAG™ knows about.
 * Connector-agnostic metadata only (no vendor runtime imports).
 */

import { CONNECTOR_CATALOG } from "@/lib/connectors/catalog";
import type { CatalogEntry, CatalogStatus } from "@/lib/connectors/orchestrator/types";
import {
  listInstallationsForOrganization,
} from "@/lib/connectors/store";

const DOCS_BASE = "/docs/connectors";

const DEPENDENCIES: Readonly<Record<string, readonly string[]>> = {
  // Example declarative dependencies (not implemented runtimes).
  hubspot: ["google-workspace"],
  salesforce: ["google-workspace"],
  gusto: ["bamboohr"],
  adp: ["bamboohr"],
  "salesforce-np": ["salesforce"],
};

const PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  "quickbooks-online": [
    "accounting.reports.read",
    "company.read",
  ],
  "google-workspace": [
    "drive.metadata.readonly",
    "calendar.readonly",
    "gmail.metadata",
    "contacts.readonly",
  ],
};

function mapAvailability(
  availability: "coming_soon" | "available",
  orgStatus?: CatalogStatus
): CatalogStatus {
  if (orgStatus) return orgStatus;
  return availability === "available" ? "Available" : "Coming Soon";
}

export type ConnectorCatalogService = {
  list(): readonly CatalogEntry[];
  get(connectorId: string): CatalogEntry | null;
  listByCategory(): Readonly<Record<string, readonly CatalogEntry[]>>;
  listForOrganization(organizationId: string): readonly CatalogEntry[];
};

function toEntry(
  def: (typeof CONNECTOR_CATALOG)[number],
  statusOverride?: CatalogStatus
): CatalogEntry {
  return {
    id: def.id,
    name: def.displayName,
    category: def.category,
    vendor: def.vendor,
    connectorVersion: def.version,
    authenticationType: def.authenticationType,
    supportedCapabilities: def.capabilities,
    supportedSyncModes: def.supportedSyncTypes,
    requiredPermissions: PERMISSIONS[def.id] ?? ["connector.read"],
    documentationUrl: `${DOCS_BASE}/15_CATALOG.md#${def.id}`,
    status: mapAvailability(def.availability, statusOverride),
    dependsOn: DEPENDENCIES[def.id] ?? [],
    description: def.description,
  };
}

export function createConnectorCatalog(): ConnectorCatalogService {
  return {
    list() {
      return Object.freeze(CONNECTOR_CATALOG.map((d) => toEntry(d)));
    },
    get(connectorId) {
      const def = CONNECTOR_CATALOG.find((d) => d.id === connectorId);
      return def ? toEntry(def) : null;
    },
    listByCategory() {
      const grouped: Record<string, CatalogEntry[]> = {};
      for (const entry of this.list()) {
        const list = grouped[entry.category] ?? [];
        list.push(entry);
        grouped[entry.category] = list;
      }
      return Object.freeze(
        Object.fromEntries(
          Object.entries(grouped).map(([k, v]) => [k, Object.freeze(v)])
        )
      );
    },
    listForOrganization(organizationId) {
      const installs = listInstallationsForOrganization(organizationId);
      const byId = new Map(installs.map((i) => [i.connectorId, i]));
      return Object.freeze(
        CONNECTOR_CATALOG.map((def) => {
          const install = byId.get(def.id);
          let status: CatalogStatus | undefined;
          if (install) {
            if (install.status === "Disabled" || !install.enabled) {
              status = "Disabled";
            } else {
              status = "Installed";
            }
          }
          return toEntry(def, status);
        })
      );
    },
  };
}
