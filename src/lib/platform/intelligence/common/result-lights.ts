/**
 * Shared light-result DTO base (Phase B / M-A1).
 * Domains extend this; do not redefine locally.
 */

export interface ResultLightBase {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: Record<string, number | undefined>;
  recommendations?: unknown[];
}
