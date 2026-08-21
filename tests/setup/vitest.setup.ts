import { vi } from "vitest";

vi.mock("@/lib/integration-hub/event-bus", () => ({
  publishEvent: vi.fn().mockResolvedValue(undefined),
}));

/**
 * OAuth state signing needs a secret to HMAC with, and refuses to guess one
 * (see src/lib/platform/integrations/core/oauth-state.ts). Deployed
 * environments supply OAUTH_STATE_SECRET / VAULT_ENCRYPTION_KEY / CRON_SECRET;
 * a bare test run supplies none, so any test that builds a connect URL threw
 * before it could assert anything.
 *
 * Assigned only when unset, so a test that manages the variable itself — as
 * tests/unit/platform/integrations/oauth-state.test.ts does — still controls it.
 */
process.env.OAUTH_STATE_SECRET ||= "test-oauth-state-secret-32chars!!";
