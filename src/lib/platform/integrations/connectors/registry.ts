/**
 * Register all Phase 1 (+ scaffold) connectors onto an IntegrationPlatform.
 */

import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import { createPlaceholderConnector } from "@/lib/platform/integrations/common/services/placeholder-connector";
import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { createAcademyOsConnector } from "@/lib/platform/integrations/connectors/academyos/connector";
import { academyOsMetadata } from "@/lib/platform/integrations/connectors/academyos/metadata";
import { bambooHrMetadata } from "@/lib/platform/integrations/connectors/bamboohr/metadata";
import { csvMetadata } from "@/lib/platform/integrations/connectors/csv/metadata";
import { googleWorkspaceMetadata } from "@/lib/platform/integrations/connectors/google-workspace/metadata";
import { createGoogleWorkspaceConnector } from "@/lib/platform/integrations/connectors/google-workspace/connector";
import { gustoMetadata } from "@/lib/platform/integrations/connectors/gusto/metadata";
import { hubspotMetadata } from "@/lib/platform/integrations/connectors/hubspot/metadata";
import { microsoftMetadata } from "@/lib/platform/integrations/connectors/microsoft/metadata";
import { ofxMetadata } from "@/lib/platform/integrations/connectors/ofx/metadata";
import { createPlaidConnector } from "@/lib/platform/integrations/connectors/plaid/connector";
import { plaidMetadata } from "@/lib/platform/integrations/connectors/plaid/metadata";
import { createQuickBooksConnector } from "@/lib/platform/integrations/connectors/quickbooks/connector";
import { quickbooksMetadata } from "@/lib/platform/integrations/connectors/quickbooks/metadata";
import { salesforceMetadata } from "@/lib/platform/integrations/connectors/salesforce/metadata";
import { createSquareConnector } from "@/lib/platform/integrations/connectors/square/connector";
import { squareMetadata } from "@/lib/platform/integrations/connectors/square/metadata";
import { stripeMetadata } from "@/lib/platform/integrations/connectors/stripe/metadata";

const PLACEHOLDER_CATALOG: ConnectorMetadata[] = [
  microsoftMetadata,
  hubspotMetadata,
  bambooHrMetadata,
  stripeMetadata,
  csvMetadata,
  salesforceMetadata,
  gustoMetadata,
  ofxMetadata,
];

const PHASE1_AND_SCAFFOLD: ConnectorMetadata[] = [
  ...PLACEHOLDER_CATALOG,
  academyOsMetadata,
  squareMetadata,
  quickbooksMetadata,
  plaidMetadata,
  googleWorkspaceMetadata,
];

/**
 * Bootstrap default connectors onto the platform registry.
 * Idempotent: skips ids already registered (does not silently overwrite versions).
 */
export function registerAllConnectors(platform: IntegrationPlatform): IntegrationPlatform {
  const deps = {
    persistence: platform.persistence,
    credentials: platform.credentials,
    events: platform.events,
    cursors: platform.cursors,
  };

  const registerOnce = (connector: Parameters<IntegrationPlatform["register"]>[0]) => {
    if (!platform.getConnector(connector.metadata.id)) {
      platform.register(connector);
    }
  };

  for (const metadata of PLACEHOLDER_CATALOG) {
    registerOnce(
      createPlaceholderConnector(metadata, deps, {
        canonicalTypeFor: defaultCanonicalType,
      })
    );
  }

  registerOnce(createAcademyOsConnector(deps));
  registerOnce(createSquareConnector(deps));
  registerOnce(createQuickBooksConnector(deps));
  registerOnce(createPlaidConnector(deps));
  registerOnce(createGoogleWorkspaceConnector(deps));

  return platform;
}

function defaultCanonicalType(objectType: string): string {
  const map: Record<string, string> = {
    user: "person.user",
    employee: "person.employee",
    student: "education.student",
    contact: "crm.contact",
    deal: "crm.opportunity",
    company: "crm.account",
    invoice: "finance.invoice",
    payment: "finance.payment",
    transaction: "finance.transaction",
    account: "finance.account",
    document: "document.file",
    message: "comms.message",
    calendar_event: "comms.event",
    file: "document.file",
  };
  return map[objectType] ?? objectType.replace(/_/g, ".");
}

export { PHASE1_AND_SCAFFOLD as CONNECTOR_CATALOG_METADATA };
