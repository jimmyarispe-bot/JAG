/**
 * Tests for the real Google Workspace client.
 *
 * Every assertion here is about a request actually leaving the process and
 * hitting a Google URL, because the defect these tests exist to prevent is the
 * opposite: a client that returns plausible records having called nothing at all.
 * A stub fetch records every URL, and the tests assert on those URLs.
 */

import { describe, expect, it, vi } from "vitest";
import { createGoogleWorkspaceApiClient } from "@/lib/platform/integrations/connectors/google-workspace/services/api-client";
import {
  googleWorkspaceClientMode,
  resolveGoogleWorkspaceClient,
} from "@/lib/platform/integrations/connectors/google-workspace/services/client-factory";

const ORG = "org-test";

type StubRoute = { match: RegExp; body: unknown; status?: number };

function stubFetch(routes: StubRoute[]) {
  const calls: string[] = [];
  const impl = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push(url);
    const route = routes.find((r) => r.match.test(url));
    const status = route?.status ?? (route ? 200 : 404);
    const payload = route?.body ?? { error: { message: `no stub for ${url}` } };
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => null },
      json: async () => payload,
      text: async () => JSON.stringify(payload),
      // Surfaced so a test can assert the Authorization header if it wants to.
      __init: init,
    } as unknown as Response;
  });
  return { impl: impl as unknown as typeof fetch, calls, spy: impl };
}

function client(routes: StubRoute[], overrides: Record<string, unknown> = {}) {
  const stub = stubFetch(routes);
  const c = createGoogleWorkspaceApiClient({
    accessToken: "access-1",
    refreshToken: "refresh-1",
    domain: "theacademyway.org",
    clientId: "cid",
    clientSecret: "csecret",
    fetchImpl: stub.impl as never,
    ...overrides,
  });
  return { c, ...stub };
}

describe("google workspace api client — it actually calls Google", () => {
  it("reads calendar events from the Calendar API and maps the fields", async () => {
    const { c, calls } = client([
      {
        match: /calendar\/v3\/calendars\/primary\/events/,
        body: {
          items: [
            {
              id: "evt-1",
              summary: "Tour — Broyld family",
              updated: "2026-09-01T12:00:00.000Z",
              status: "confirmed",
              start: { dateTime: "2026-09-05T15:00:00Z" },
              end: { dateTime: "2026-09-05T15:30:00Z" },
              organizer: { email: "nina@theacademyway.org" },
              attendees: [{ email: "dennisjbroyldjr@gmail.com" }],
            },
          ],
          nextPageToken: "page-2",
        },
      },
    ]);

    const page = await c.list(ORG, "calendar_event", null, null);

    expect(calls[0]).toContain("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    expect(page.records).toHaveLength(1);
    expect(page.records[0].objectType).toBe("calendar_event");
    expect(page.records[0].payload.title).toBe("Tour — Broyld family");
    expect(page.records[0].payload.attendees).toEqual(["dennisjbroyldjr@gmail.com"]);
    expect(page.records[0].updatedAt).toBe("2026-09-01T12:00:00.000Z");
    expect(page.nextCursor).toBe("page-2");
  });

  it("passes the incremental checkpoint to Calendar as updatedMin", async () => {
    const { c, calls } = client([{ match: /calendars\/primary\/events/, body: { items: [] } }]);
    await c.list(ORG, "calendar_event", "2026-08-01T00:00:00.000Z", null);
    expect(calls[0]).toContain("updatedMin=2026-08-01T00%3A00%3A00.000Z");
  });

  it("filters Drive by mime type so a doc is never also emitted as a drive_file", async () => {
    const { c, calls } = client([{ match: /drive\/v3\/files/, body: { files: [] } }]);

    // URLSearchParams encodes spaces as "+", which decodeURIComponent leaves
    // alone — so normalise before asserting on the human-readable query.
    const readable = (url: string) => decodeURIComponent(url).replace(/\+/g, " ");

    await c.list(ORG, "doc", null, null);
    expect(readable(calls[0])).toContain("mimeType = 'application/vnd.google-apps.document'");

    await c.list(ORG, "drive_file", null, null);
    const generic = readable(calls[1]);
    expect(generic).toContain("mimeType != 'application/vnd.google-apps.document'");
    expect(generic).toContain("mimeType != 'application/vnd.google-apps.folder'");
  });

  it("fetches Gmail message metadata and derives attachments from the same call", async () => {
    const { c, calls } = client([
      { match: /users\/me\/messages\?/, body: { messages: [{ id: "m1" }] } },
      {
        match: /users\/me\/messages\/m1/,
        body: {
          id: "m1",
          threadId: "t1",
          internalDate: "1788300000000",
          historyId: "99",
          payload: {
            headers: [
              { name: "Subject", value: "Inquiry about 6th grade" },
              { name: "From", value: "tara1n6@yahoo.com" },
            ],
            parts: [{ filename: "report-card.pdf", mimeType: "application/pdf", body: { attachmentId: "a1", size: 1024 } }],
          },
        },
      },
    ]);

    const page = await c.list(ORG, "message", null, null);

    expect(calls[0]).toContain("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    // format=metadata is the privacy contract, not an accident.
    expect(calls[1]).toContain("format=metadata");

    const message = page.records.find((r) => r.objectType === "message");
    const attachment = page.records.find((r) => r.objectType === "attachment");
    expect(message?.payload.subject).toBe("Inquiry about 6th grade");
    expect(attachment?.payload.filename).toBe("report-card.pdf");
    expect(attachment?.payload.messageId).toBe("m1");
  });

  it("drops Gmail messages older than the checkpoint", async () => {
    const { c } = client([
      { match: /users\/me\/messages\?/, body: { messages: [{ id: "old" }] } },
      {
        match: /users\/me\/messages\/old/,
        body: { id: "old", internalDate: "1600000000000", payload: { headers: [] } },
      },
    ]);

    const page = await c.list(ORG, "message", "2026-01-01T00:00:00.000Z", null);
    expect(page.records).toHaveLength(0);
    // Nothing older remains worth paging, so the walk stops rather than
    // marching back through the entire mailbox.
    expect(page.nextCursor).toBeNull();
  });

  it("walks task lists then tasks, encoding both positions in one cursor", async () => {
    const routes: StubRoute[] = [
      { match: /users\/@me\/lists/, body: { items: [{ id: "L1", title: "Admissions" }, { id: "L2", title: "Ops" }] } },
      { match: /lists\/L1\/tasks/, body: { items: [{ id: "t1", title: "Call Tara", updated: "2026-09-01T00:00:00.000Z" }] } },
    ];
    const { c } = client(routes);

    const first = await c.list(ORG, "task", null, null);
    expect(first.records[0].payload.taskListTitle).toBe("Admissions");
    // L1 exhausted with no page token, so the cursor advances to the next list.
    expect(first.nextCursor).toBe("1|");
  });

  it("refreshes once on 401 and retries the same request", async () => {
    let messagesCalls = 0;
    const stub = vi.fn(async (url: string) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ access_token: "access-2", expires_in: 3600 }),
          text: async () => "",
        } as unknown as Response;
      }
      messagesCalls += 1;
      const unauthorized = messagesCalls === 1;
      return {
        ok: !unauthorized,
        status: unauthorized ? 401 : 200,
        headers: { get: () => null },
        json: async () => (unauthorized ? {} : { labels: [{ id: "INBOX", name: "Inbox" }] }),
        text: async () => "",
      } as unknown as Response;
    });

    const persisted: { accessToken: string }[] = [];
    const c = createGoogleWorkspaceApiClient({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      clientId: "cid",
      clientSecret: "csecret",
      fetchImpl: stub as never,
      onTokenRefreshed: (t) => {
        persisted.push({ accessToken: t.accessToken });
      },
    });

    const page = await c.list(ORG, "label", null, null);

    expect(page.records).toHaveLength(1);
    expect(messagesCalls).toBe(2); // failed once, retried once
    // The refreshed token must reach the caller, or every later sync 401s again.
    expect(persisted).toEqual([{ accessToken: "access-2" }]);
  });

  it("surfaces a failed refresh as an error rather than an empty result set", async () => {
    const stub = vi.fn(async (url: string) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        return {
          ok: false,
          status: 400,
          headers: { get: () => null },
          json: async () => ({ error: "invalid_grant", error_description: "Token has been revoked." }),
          text: async () => "",
        } as unknown as Response;
      }
      return {
        ok: false,
        status: 401,
        headers: { get: () => null },
        json: async () => ({}),
        text: async () => "",
      } as unknown as Response;
    });

    const c = createGoogleWorkspaceApiClient({
      accessToken: "access-1",
      refreshToken: "revoked",
      clientId: "cid",
      clientSecret: "csecret",
      fetchImpl: stub as never,
    });

    await expect(c.list(ORG, "label", null, null)).rejects.toThrow(/Token has been revoked/);
  });


  it("identifies the account via Gmail's profile, not oauth2 userinfo", async () => {
    // Regression: authenticate() used to call oauth2/v3/userinfo, which needs the
    // openid / userinfo.email scope. The consent screen never asks for one, so a
    // valid token came back 401 "Invalid Credentials" and every sync failed at
    // the first step. users.getProfile is covered by gmail.metadata, which IS
    // granted.
    const { c, calls } = client([
      { match: /users\/me\/profile/, body: { emailAddress: "jimmy@theacademyway.org" } },
      { match: /admin\/directory\/v1\/customer/, status: 403, body: {} },
    ]);

    const result = await c.authenticate({ accessToken: "access-1", consentType: "admin" });

    expect(result.ok).toBe(true);
    expect(calls.some((u) => u.includes("oauth2/v3/userinfo"))).toBe(false);
    expect(calls[0]).toContain("https://gmail.googleapis.com/gmail/v1/users/me/profile");
    // Domain is derived from the address, and a non-admin 403 on the Admin SDK
    // still leaves a usable session rather than failing the connection.
    expect(result.session?.domain).toBe("theacademyway.org");
  });

  it("does not retry a 403 scope error — it must surface immediately", async () => {
    let attempts = 0;
    const stub = vi.fn(async () => {
      attempts += 1;
      return {
        ok: false,
        status: 403,
        headers: { get: () => null },
        json: async () => ({}),
        text: async () => JSON.stringify({ error: { message: "Request had insufficient authentication scopes." } }),
      } as unknown as Response;
    });

    const c = createGoogleWorkspaceApiClient({
      accessToken: "a",
      refreshToken: null,
      clientId: "cid",
      clientSecret: "csecret",
      fetchImpl: stub as never,
    });

    await expect(c.list(ORG, "directory_user", null, null)).rejects.toThrow(/insufficient authentication scopes/);
    expect(attempts).toBe(1);
  });
});

describe("client factory — the decision that was previously hardcoded", () => {
  const saved = {
    id: process.env.GOOGLE_WORKSPACE_CLIENT_ID,
    secret: process.env.GOOGLE_WORKSPACE_CLIENT_SECRET,
    legacyId: process.env.GOOGLE_CLIENT_ID,
    legacySecret: process.env.GOOGLE_CLIENT_SECRET,
  };

  function clearCreds() {
    delete process.env.GOOGLE_WORKSPACE_CLIENT_ID;
    delete process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  }

  function restore() {
    if (saved.id) process.env.GOOGLE_WORKSPACE_CLIENT_ID = saved.id;
    if (saved.secret) process.env.GOOGLE_WORKSPACE_CLIENT_SECRET = saved.secret;
    if (saved.legacyId) process.env.GOOGLE_CLIENT_ID = saved.legacyId;
    if (saved.legacySecret) process.env.GOOGLE_CLIENT_SECRET = saved.legacySecret;
  }

  it("reports demo mode when credentials are absent", () => {
    clearCreds();
    try {
      expect(googleWorkspaceClientMode()).toBe("demo");
      const { mode } = resolveGoogleWorkspaceClient({ accessToken: "a" });
      expect(mode).toBe("demo");
    } finally {
      restore();
    }
  });

  it("returns the live client as soon as both credentials exist", () => {
    clearCreds();
    process.env.GOOGLE_WORKSPACE_CLIENT_ID = "cid";
    process.env.GOOGLE_WORKSPACE_CLIENT_SECRET = "csecret";
    try {
      expect(googleWorkspaceClientMode()).toBe("live");
      const { mode } = resolveGoogleWorkspaceClient({ accessToken: "a" });
      expect(mode).toBe("live");
    } finally {
      clearCreds();
      restore();
    }
  });

  it("only half-configured is still demo — one credential is not a connection", () => {
    clearCreds();
    process.env.GOOGLE_WORKSPACE_CLIENT_ID = "cid";
    try {
      expect(googleWorkspaceClientMode()).toBe("demo");
    } finally {
      clearCreds();
      restore();
    }
  });
});
