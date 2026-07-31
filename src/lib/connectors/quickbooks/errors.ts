import type { QboConnectorError, QboSyncFailureCode } from "@/lib/connectors/quickbooks/types";

export function qboError(
  code: QboSyncFailureCode,
  message: string,
  retryable = false
): QboConnectorError {
  return { code, message, retryable };
}

export function classifyQboHttpError(
  status: number,
  bodyText: string
): QboConnectorError {
  const lower = bodyText.toLowerCase();
  if (status === 401) {
    if (lower.includes("revoke") || lower.includes("invalid_grant")) {
      return qboError(
        "revoked_authorization",
        "QuickBooks authorization was revoked. Reconnect the organization.",
        false
      );
    }
    return qboError(
      "expired_token",
      "QuickBooks access token expired. Refreshing credentials.",
      true
    );
  }
  if (status === 403) {
    return qboError(
      "revoked_authorization",
      "QuickBooks denied access. Reconnect the organization.",
      false
    );
  }
  if (status === 429) {
    return qboError(
      "rate_limited",
      "QuickBooks API rate limit reached. Retry shortly.",
      true
    );
  }
  if (status >= 500) {
    return qboError(
      "network_failure",
      "QuickBooks service is temporarily unavailable.",
      true
    );
  }
  return qboError(
    "invalid_response",
    `Unexpected QuickBooks response (${status}).`,
    status >= 500
  );
}

export function classifyThrownError(err: unknown): QboConnectorError {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    "message" in err &&
    "retryable" in err
  ) {
    return err as QboConnectorError;
  }
  const message = err instanceof Error ? err.message : "Unknown sync error.";
  if (/fetch failed|ECONNRESET|ETIMEDOUT|network/i.test(message)) {
    return qboError("network_failure", message, true);
  }
  return qboError("unknown", message, true);
}
