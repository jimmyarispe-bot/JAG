/** Shared constants for JAG greenfield baseline tooling. */

export const PRODUCTION_DENY_REF = "ybcpaffklggaloxhnqkl";

export const BASELINE_ID = "GA_BASELINE_212";
export const CUTOFF_MIGRATION = 212;
export const BASELINE_FORMAT_VERSION = 1;

export const PROHIBITED_AUTH_UUID = "d346c418-26d0-47b0-8655-ce64173dffb1";
export const PROHIBITED_AUTH_EMAIL = "jimmy.arispe@theacademyway.org";

/** Historical repairs excluded from greenfield composition. */
export const EXCLUDED_HISTORICAL_REPAIRS = {
  "158_sprint002_authenticated_founder_repair.sql": {
    version: 158,
    classification: "HISTORICAL_DATA_REPAIR",
    included_in_greenfield: false,
    reason:
      "Requires historical production Auth identity and is not required canonical state.",
  },
};

export const REQUIRED_IMMUTABLE_158_BLOB =
  "540b99a23210795f6b6eba9bfd472f39a7997746";
