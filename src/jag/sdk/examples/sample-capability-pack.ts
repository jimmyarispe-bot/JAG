/**
 * SDK example — simple capability pack built only via @/jag/sdk.
 */

import { buildCapabilityPack, validateCapabilityPack } from "@/jag/sdk";

/** Example pack — not a production foundation pack. */
export const exampleAssetManagementPack = buildCapabilityPack({
  id: "asset-management.example",
  label: "Asset Management (SDK Example)",
  version: "1.0.0",
  description:
    "SDK example capability pack — manifest + modules only.",
  modules: Object.freeze(["asset_management"]),
  status: "draft",
  dependencies: Object.freeze([
    Object.freeze({
      packId: "identity.core",
      versionRange: "^1.0.0",
      optional: true,
    }),
  ]),
  tags: Object.freeze(["asset-management", "sdk-example"]),
});

export function validateExampleAssetManagementPack() {
  return validateCapabilityPack(exampleAssetManagementPack);
}
