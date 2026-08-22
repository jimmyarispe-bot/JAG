/**
 * Ensure secrets never appear in logs or persisted diagnostics.
 */

const SENSITIVE_KEY =
  /api[_-]?key|authorization|password|secret|token|bearer/i;

export function redactSecrets(value: unknown, apiKey?: string): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    let out = value;
    if (apiKey && apiKey.length > 0) {
      out = out.split(apiKey).join("[REDACTED]");
    }
    out = out.replace(/(x-api-key\s*[:=]\s*)([^\s"']+)/gi, "$1[REDACTED]");
    out = out.replace(
      /(authorization\s*[:=]\s*Bearer\s+)([^\s"']+)/gi,
      "$1[REDACTED]"
    );
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item, apiKey));
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(record)) {
      if (SENSITIVE_KEY.test(key)) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactSecrets(nested, apiKey);
      }
    }
    return out;
  }
  return value;
}

export function safeLog(message: string, apiKey?: string): void {
  console.log(String(redactSecrets(message, apiKey)));
}
