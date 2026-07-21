/** Compatibility shim — prefer `normalization/` and `mapping/`. */
export { googleWorkspaceCanonicalType, CANONICAL_TYPE } from "@/lib/platform/integrations/connectors/google-workspace/mapping";
export {
  resolvePrivacyPolicy,
  scrubPayloadForPrivacy,
  toSyncRecords,
  normalizeGoogleWorkspaceRecords,
  jagInternalId,
} from "@/lib/platform/integrations/connectors/google-workspace/normalization";
