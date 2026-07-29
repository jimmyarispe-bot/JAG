/**
 * The JAG™ platform version metadata — GA release management foundation.
 */

export type JagPlatformVersionInfo = {
  readonly productName: "The JAG™";
  readonly platformVersion: string;
  readonly schemaVersion: string;
  readonly connectorVersion: string;
  readonly evidenceVersion: string;
  readonly apiVersion: string;
  readonly knowledgeGraphVersion: string;
  readonly buildLabel: string;
};

export const JAG_PLATFORM_VERSION: JagPlatformVersionInfo = Object.freeze({
  productName: "The JAG™",
  platformVersion: "1.0.0-ga",
  schemaVersion: "209",
  connectorVersion: "1.0.0",
  evidenceVersion: "1.0.0",
  apiVersion: "v1",
  knowledgeGraphVersion: "1.0.0",
  buildLabel:
    "Sprint P1 — Platform Foundation v1.0 Certification & Architecture Freeze™",
});

export function formatPlatformVersionBanner(
  info: JagPlatformVersionInfo = JAG_PLATFORM_VERSION
): string {
  return `${info.productName} ${info.platformVersion} (API ${info.apiVersion}, schema ${info.schemaVersion})`;
}
