/**
 * Register all Phase 1 (+ scaffold) connectors onto an IntegrationPlatform.
 */

import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import { createPlaceholderConnector } from "@/lib/platform/integrations/common/services/placeholder-connector";
import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { createAcademyOsConnector } from "@/lib/platform/integrations/connectors/academyos/connector";
import { academyOsMetadata } from "@/lib/platform/integrations/connectors/academyos/metadata";
import { csvMetadata } from "@/lib/platform/integrations/connectors/csv/metadata";
import { googleWorkspaceMetadata } from "@/lib/platform/integrations/connectors/google-workspace/metadata";
import { createGoogleWorkspaceConnector } from "@/lib/platform/integrations/connectors/google-workspace/connector";
import { microsoft365Metadata } from "@/lib/platform/integrations/connectors/microsoft-365/metadata";
import { createMicrosoft365Connector } from "@/lib/platform/integrations/connectors/microsoft-365/connector";
import {
  createCollaborationB4Connector,
  slackMetadata,
  teamsMetadata,
  zoomMetadata,
  googleMeetMetadata,
} from "@/lib/platform/integrations/connectors/collaboration";
import {
  createFinanceB4Connector,
  stripeMetadata,
} from "@/lib/platform/integrations/connectors/finance";
import {
  createEnterpriseB4Connector,
  ENTERPRISE_B4_METADATA,
  stateEducationMetadata,
  scholarshipMetadata,
  medicaidMetadata,
  grantMetadata,
} from "@/lib/platform/integrations/connectors/enterprise";
import type { EnterpriseProvider } from "@/lib/platform/integrations/connectors/enterprise/entities";
import {
  createHrB4Connector,
  HR_B4_METADATA,
  gustoMetadata,
  adpMetadata,
  paylocityMetadata,
  bambooHrMetadata,
} from "@/lib/platform/integrations/connectors/hr";
import type { HrProvider } from "@/lib/platform/integrations/connectors/hr/entities";
import {
  createCrmB4Connector,
  CRM_B4_METADATA,
  hubspotMetadata,
  salesforceMetadata,
} from "@/lib/platform/integrations/connectors/crm";
import type { CrmProvider } from "@/lib/platform/integrations/connectors/crm/entities";
import {
  createEducationB4Connector,
  EDUCATION_B4_METADATA,
  canvasMetadata,
  powerschoolMetadata,
  googleClassroomMetadata,
} from "@/lib/platform/integrations/connectors/education";
import type { EducationProvider } from "@/lib/platform/integrations/connectors/education/entities";
import { ofxMetadata } from "@/lib/platform/integrations/connectors/ofx/metadata";
import { createPlaidConnector } from "@/lib/platform/integrations/connectors/plaid/connector";
import { plaidMetadata } from "@/lib/platform/integrations/connectors/plaid/metadata";
import { createQuickBooksConnector } from "@/lib/platform/integrations/connectors/quickbooks/connector";
import { quickbooksMetadata } from "@/lib/platform/integrations/connectors/quickbooks/metadata";
import { createSquareConnector } from "@/lib/platform/integrations/connectors/square/connector";
import { squareMetadata } from "@/lib/platform/integrations/connectors/square/metadata";

/** Immutable placeholder catalog — remaining scaffolds only. */
const PLACEHOLDER_CATALOG: readonly ConnectorMetadata[] = Object.freeze([
  csvMetadata,
  ofxMetadata,
]);

/** Immutable full catalog metadata for UI / listings. */
const PHASE1_AND_SCAFFOLD: readonly ConnectorMetadata[] = Object.freeze([
  ...PLACEHOLDER_CATALOG,
  academyOsMetadata,
  squareMetadata,
  quickbooksMetadata,
  plaidMetadata,
  stripeMetadata,
  googleWorkspaceMetadata,
  microsoft365Metadata,
  slackMetadata,
  teamsMetadata,
  zoomMetadata,
  googleMeetMetadata,
  hubspotMetadata,
  salesforceMetadata,
  gustoMetadata,
  adpMetadata,
  paylocityMetadata,
  bambooHrMetadata,
  canvasMetadata,
  powerschoolMetadata,
  googleClassroomMetadata,
  stateEducationMetadata,
  scholarshipMetadata,
  medicaidMetadata,
  grantMetadata,
]);

const CANONICAL_TYPE_MAP: Readonly<Record<string, string>> = Object.freeze({
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
  calendar_event: "comms.calendar_event",
  file: "document.file",
});

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
  registerOnce(createMicrosoft365Connector(deps));
  registerOnce(createCollaborationB4Connector(slackMetadata, "slack", deps));
  registerOnce(createCollaborationB4Connector(teamsMetadata, "teams", deps));
  registerOnce(createCollaborationB4Connector(zoomMetadata, "zoom", deps));
  registerOnce(
    createCollaborationB4Connector(googleMeetMetadata, "google_meet", deps)
  );
  registerOnce(createFinanceB4Connector(stripeMetadata, "stripe", deps));

  for (const metadata of ENTERPRISE_B4_METADATA) {
    registerOnce(
      createEnterpriseB4Connector(metadata, metadata.id as EnterpriseProvider, deps)
    );
  }

  for (const metadata of HR_B4_METADATA) {
    registerOnce(createHrB4Connector(metadata, metadata.id as HrProvider, deps));
  }

  for (const metadata of CRM_B4_METADATA) {
    registerOnce(createCrmB4Connector(metadata, metadata.id as CrmProvider, deps));
  }

  for (const metadata of EDUCATION_B4_METADATA) {
    registerOnce(
      createEducationB4Connector(metadata, metadata.id as EducationProvider, deps)
    );
  }

  return platform;
}

function defaultCanonicalType(objectType: string): string {
  return CANONICAL_TYPE_MAP[objectType] ?? objectType.replace(/_/g, ".");
}

export { PHASE1_AND_SCAFFOLD as CONNECTOR_CATALOG_METADATA };
