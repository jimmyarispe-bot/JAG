/**
 * One place that decides whether Google Workspace talks to Google or to a fixture.
 *
 * Before this existed the decision was made twice, by hardcoding
 * `createDemoGoogleWorkspaceClient()` at two call sites — the sync engine and the
 * token bridge — with no way for an operator to tell which world they were in. A
 * connected org synced demo records into its real knowledge graph and the badge
 * went green.
 *
 * The rule now: real credentials mean the real client, always. The demo client is
 * reachable only by asking for it explicitly, and callers can ask
 * `googleWorkspaceClientMode()` what they are about to get so the answer can be
 * shown to a human instead of guessed at.
 */

import {
  createGoogleWorkspaceApiClient,
  type GoogleWorkspaceApiClientOptions,
} from "@/lib/platform/integrations/connectors/google-workspace/services/api-client";
import {
  createDemoGoogleWorkspaceClient,
  type GoogleWorkspaceClient,
} from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";

export type GoogleWorkspaceClientMode = "live" | "demo";

export function googleWorkspaceCredentials(): {
  clientId: string;
  clientSecret: string;
  configured: boolean;
} {
  const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_WORKSPACE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

/** What a client built right now would be. Safe to render in an admin page. */
export function googleWorkspaceClientMode(): GoogleWorkspaceClientMode {
  return googleWorkspaceCredentials().configured ? "live" : "demo";
}

/**
 * A sentence an operator can act on. Deliberately not "Connected" — the whole
 * failure this replaces was a green badge that meant nothing.
 */
export function describeGoogleWorkspaceMode(mode: GoogleWorkspaceClientMode = googleWorkspaceClientMode()): string {
  return mode === "live"
    ? "Live — syncing from Google."
    : "DEMO DATA — GOOGLE_WORKSPACE_CLIENT_ID and GOOGLE_WORKSPACE_CLIENT_SECRET are not set, so nothing is being read from Google. Any records shown are fixtures.";
}

export type ResolveGoogleWorkspaceClientInput = Omit<
  GoogleWorkspaceApiClientOptions,
  "clientId" | "clientSecret"
> & {
  /** Force the fixture client regardless of credentials. Tests and demo orgs only. */
  forceDemo?: boolean;
};

export function resolveGoogleWorkspaceClient(input: ResolveGoogleWorkspaceClientInput): {
  client: GoogleWorkspaceClient;
  mode: GoogleWorkspaceClientMode;
} {
  const creds = googleWorkspaceCredentials();
  if (input.forceDemo || !creds.configured) {
    return { client: createDemoGoogleWorkspaceClient(), mode: "demo" };
  }
  return {
    client: createGoogleWorkspaceApiClient({
      ...input,
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
    }),
    mode: "live",
  };
}
