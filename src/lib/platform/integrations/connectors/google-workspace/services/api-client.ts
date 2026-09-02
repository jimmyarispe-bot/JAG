/**
 * Google Workspace SoR client — the real one.
 *
 * Until this file existed, `createDemoGoogleWorkspaceClient` was not a fallback,
 * it was the implementation: nothing in the codebase ever injected a real client,
 * there was no Google API dependency, and there was not one HTTP call to a Google
 * endpoint anywhere in `src/`. A connected org would authorise for real, store a
 * real encrypted token, and then sync a hardcoded demo catalogue into its
 * knowledge graph while `last_successful_sync_at` advanced and the badge went
 * green. This client closes that gap.
 *
 * No new npm dependency. `googleapis` is a very large package and every surface
 * used here is a plain REST GET, so this talks to the endpoints directly with
 * `fetch`. The trade is that pagination and field selection are written out by
 * hand below rather than inherited from a library — which is also why each
 * object type carries a comment saying exactly which endpoint backs it.
 *
 * Scope note: the consent screen requests read-only scopes only. Nothing here
 * writes to Google, and there is deliberately no code path that could.
 */

import { RateLimiter, withRetry } from "@/lib/platform/integrations/common/sync/resilience";
import type {
  GoogleWorkspaceDomain,
  GoogleWorkspaceAuthSession,
} from "@/lib/platform/integrations/connectors/google-workspace/auth";
import type {
  GoogleWorkspaceObjectType,
  GoogleWorkspaceRawEntity,
} from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type {
  GoogleWorkspaceClient,
  GoogleWorkspaceListPage,
} from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type GoogleWorkspaceApiClientOptions = {
  accessToken: string;
  refreshToken?: string | null;
  /** Primary Workspace domain. Used to stamp records; discovered if omitted. */
  domain?: string | null;
  clientId?: string;
  clientSecret?: string;
  /**
   * Called when a 401 forced a refresh mid-sync, so the caller can persist the
   * new token. Without this the refreshed token lives only for this run and the
   * next sync starts by 401-ing again.
   */
  onTokenRefreshed?: (tokens: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: string;
  }) => Promise<void> | void;
  fetchImpl?: FetchLike;
  maxRequestsPerMinute?: number;
};

const GMAIL = "https://gmail.googleapis.com/gmail/v1";
const CALENDAR = "https://www.googleapis.com/calendar/v3";
const DRIVE = "https://www.googleapis.com/drive/v3";
const PEOPLE = "https://people.googleapis.com/v1";
const TASKS = "https://tasks.googleapis.com/tasks/v1";
const ADMIN = "https://admin.googleapis.com/admin/directory/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

const PAGE_SIZE = 50;

/** Drive mime types, so doc/sheet/slide can be split out of drive_file. */
const MIME = {
  folder: "application/vnd.google-apps.folder",
  doc: "application/vnd.google-apps.document",
  sheet: "application/vnd.google-apps.spreadsheet",
  slide: "application/vnd.google-apps.presentation",
} as const;

class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

function iso(value: unknown, fallback: string): string {
  if (typeof value === "string" && value) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return fallback;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

export function createGoogleWorkspaceApiClient(
  options: GoogleWorkspaceApiClientOptions
): GoogleWorkspaceClient {
  const doFetch: FetchLike = options.fetchImpl ?? ((url, init) => fetch(url, init));
  const limiter = new RateLimiter(options.maxRequestsPerMinute ?? 240, 60_000);

  let accessToken = options.accessToken;
  let refreshToken = options.refreshToken ?? null;
  let domain = options.domain ?? "";
  const clientId = options.clientId ?? process.env.GOOGLE_WORKSPACE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret =
    options.clientSecret ?? process.env.GOOGLE_WORKSPACE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";

  let rateLimitRemaining = options.maxRequestsPerMinute ?? 240;

  async function exchangeRefreshToken(): Promise<
    { ok: true; accessToken: string; refreshToken: string | null; expiresAt: string } | { ok: false; error: string }
  > {
    if (!refreshToken) return { ok: false, error: "No refresh token stored for this connection." };
    if (!clientId || !clientSecret) {
      return {
        ok: false,
        error:
          "GOOGLE_WORKSPACE_CLIENT_ID / GOOGLE_WORKSPACE_CLIENT_SECRET are not set, so the refresh token cannot be exchanged.",
      };
    }

    const response = await doFetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const detail =
        typeof body.error_description === "string"
          ? body.error_description
          : typeof body.error === "string"
            ? body.error
            : `HTTP ${response.status}`;
      return { ok: false, error: `Google refused the refresh token: ${detail}` };
    }

    const nextAccess = typeof body.access_token === "string" ? body.access_token : "";
    if (!nextAccess) return { ok: false, error: "Google returned no access_token on refresh." };

    const expiresInSec = typeof body.expires_in === "number" ? body.expires_in : 3600;
    // Google only returns a new refresh_token on the first exchange; keep the old
    // one otherwise, or the connection becomes unrefreshable after one hour.
    const nextRefresh = typeof body.refresh_token === "string" ? body.refresh_token : refreshToken;
    const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

    accessToken = nextAccess;
    refreshToken = nextRefresh;
    return { ok: true, accessToken: nextAccess, refreshToken: nextRefresh, expiresAt };
  }

  /**
   * One authorised GET. On a 401 it refreshes once and retries once — never in a
   * loop, so an unrecoverable credential fails fast instead of hammering Google.
   */
  async function apiGet<T>(url: string, allowRetry = true): Promise<T> {
    await limiter.acquire();
    const response = await doFetch(url, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
    });

    const remaining = response.headers?.get?.("x-ratelimit-remaining");
    if (remaining && !Number.isNaN(Number(remaining))) rateLimitRemaining = Number(remaining);

    if (response.status === 401 && allowRetry) {
      const refreshed = await exchangeRefreshToken();
      if (!refreshed.ok) {
        throw new GoogleApiError(
          `Google rejected the access token and it could not be refreshed. ${refreshed.error}`,
          401,
          url
        );
      }
      if (options.onTokenRefreshed) {
        await options.onTokenRefreshed({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: refreshed.expiresAt,
        });
      }
      return apiGet<T>(url, false);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let detail = text.slice(0, 300);
      try {
        const parsed = JSON.parse(text) as { error?: { message?: string } };
        if (parsed.error?.message) detail = parsed.error.message;
      } catch {
        /* keep the raw text */
      }
      throw new GoogleApiError(`Google API ${response.status} on ${url}: ${detail}`, response.status, url);
    }

    return (await response.json()) as T;
  }

  /** Retry only the transient shapes; a 403 scope error must surface immediately. */
  function retrying<T>(fn: () => Promise<T>): Promise<T> {
    return withRetry(fn, {
      attempts: 3,
      baseDelayMs: 250,
      shouldRetry: (error) => {
        if (error instanceof GoogleApiError) return error.status === 429 || error.status >= 500;
        const msg = error instanceof Error ? error.message : String(error);
        return /rate.?limit|timeout|ECONN|ETIMEDOUT|socket hang up/i.test(msg);
      },
    });
  }

  function entity(
    objectType: GoogleWorkspaceObjectType,
    id: string,
    organizationId: string,
    userId: string | null,
    updatedAt: string,
    payload: Record<string, unknown>,
    version = 1
  ): GoogleWorkspaceRawEntity {
    return {
      id,
      objectType,
      organizationId,
      workspaceDomain: domain,
      userId,
      updatedAt,
      version,
      payload: {
        ...payload,
        name: payload.name ?? payload.title ?? payload.subject ?? payload.summary ?? id,
      },
    };
  }

  // ---------------------------------------------------------------- Gmail ----

  /**
   * Gmail list endpoints return ids only, so each id needs a second call.
   *
   * `format=metadata` is deliberate and not a limitation to be worked around: the
   * connector's privacy policy is metadata-only by default, and the granted scope
   * (gmail.metadata) cannot return bodies even if asked. That same scope also
   * forbids the `q` search parameter, which is why incremental sync below filters
   * on internalDate client-side rather than sending `after:` to Google.
   */
  async function gmailMessages(
    organizationId: string,
    since: string | null,
    cursor: string | null
  ): Promise<GoogleWorkspaceListPage> {
    const list = await retrying(() =>
      apiGet<{ messages?: { id: string }[]; nextPageToken?: string }>(
        `${GMAIL}/users/me/messages${qs({ maxResults: PAGE_SIZE, pageToken: cursor })}`
      )
    );

    const sinceMs = since ? Date.parse(since) : null;
    const records: GoogleWorkspaceRawEntity[] = [];
    let sawOlderThanSince = false;

    for (const ref of list.messages ?? []) {
      const msg = await retrying(() =>
        apiGet<{
          id: string;
          threadId?: string;
          labelIds?: string[];
          internalDate?: string;
          historyId?: string;
          sizeEstimate?: number;
          payload?: {
            headers?: { name: string; value: string }[];
            parts?: { filename?: string; mimeType?: string; body?: { attachmentId?: string; size?: number } }[];
          };
        }>(`${GMAIL}/users/me/messages/${encodeURIComponent(ref.id)}${qs({ format: "metadata" })}`)
      );

      const internalMs = Number(msg.internalDate ?? 0);
      const updatedAt = iso(Number.isFinite(internalMs) && internalMs > 0 ? internalMs : null, new Date().toISOString());
      if (sinceMs && internalMs && internalMs < sinceMs) {
        sawOlderThanSince = true;
        continue;
      }

      const headers = new Map((msg.payload?.headers ?? []).map((h) => [h.name.toLowerCase(), h.value]));
      records.push(
        entity(
          "message",
          msg.id,
          organizationId,
          headers.get("from") ?? null,
          updatedAt,
          {
            subject: headers.get("subject") ?? "(no subject)",
            from: headers.get("from") ?? "",
            to: headers.get("to") ?? "",
            cc: headers.get("cc") ?? "",
            date: headers.get("date") ?? "",
            threadId: msg.threadId ?? null,
            labelIds: msg.labelIds ?? [],
            sizeEstimate: msg.sizeEstimate ?? 0,
          },
          Number(msg.historyId ?? 1) || 1
        )
      );

      // Attachments are metadata rows derived from the same call — filename and
      // size only, never content.
      for (const part of msg.payload?.parts ?? []) {
        if (!part.filename || !part.body?.attachmentId) continue;
        records.push(
          entity("attachment", part.body.attachmentId, organizationId, headers.get("from") ?? null, updatedAt, {
            filename: part.filename,
            mimeType: part.mimeType ?? "application/octet-stream",
            size: part.body.size ?? 0,
            messageId: msg.id,
          })
        );
      }
    }

    // Gmail lists newest-first. Once a whole page predates the checkpoint there is
    // nothing older worth walking, so stop rather than paging the whole mailbox.
    const nextCursor = sawOlderThanSince && records.length === 0 ? null : (list.nextPageToken ?? null);
    return { records, nextCursor };
  }

  async function gmailThreads(
    organizationId: string,
    cursor: string | null
  ): Promise<GoogleWorkspaceListPage> {
    const list = await retrying(() =>
      apiGet<{ threads?: { id: string; snippet?: string; historyId?: string }[]; nextPageToken?: string }>(
        `${GMAIL}/users/me/threads${qs({ maxResults: PAGE_SIZE, pageToken: cursor })}`
      )
    );
    const now = new Date().toISOString();
    return {
      records: (list.threads ?? []).map((t) =>
        entity("thread", t.id, organizationId, null, now, { snippet: t.snippet ?? "" }, Number(t.historyId ?? 1) || 1)
      ),
      nextCursor: list.nextPageToken ?? null,
    };
  }

  async function gmailLabels(organizationId: string): Promise<GoogleWorkspaceListPage> {
    const list = await retrying(() =>
      apiGet<{ labels?: { id: string; name: string; type?: string }[] }>(`${GMAIL}/users/me/labels`)
    );
    const now = new Date().toISOString();
    return {
      // labels.list is not paginated by Google — one call is the whole set.
      records: (list.labels ?? []).map((l) =>
        entity("label", l.id, organizationId, null, now, { name: l.name, labelType: l.type ?? "user" })
      ),
      nextCursor: null,
    };
  }

  // ------------------------------------------------------------- Calendar ----

  async function calendarEvents(
    organizationId: string,
    since: string | null,
    cursor: string | null,
    meetOnly: boolean
  ): Promise<GoogleWorkspaceListPage> {
    const list = await retrying(() =>
      apiGet<{
        items?: {
          id: string;
          summary?: string;
          description?: string;
          status?: string;
          updated?: string;
          htmlLink?: string;
          location?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
          organizer?: { email?: string };
          attendees?: { email?: string; responseStatus?: string }[];
          conferenceData?: { conferenceId?: string; entryPoints?: { uri?: string; entryPointType?: string }[] };
        }[];
        nextPageToken?: string;
      }>(
        `${CALENDAR}/calendars/primary/events${qs({
          maxResults: PAGE_SIZE,
          pageToken: cursor,
          singleEvents: "true",
          orderBy: cursor ? undefined : "updated",
          updatedMin: since ?? undefined,
          showDeleted: "false",
        })}`
      )
    );

    const now = new Date().toISOString();
    const records: GoogleWorkspaceRawEntity[] = [];
    for (const item of list.items ?? []) {
      const updatedAt = iso(item.updated, now);
      const conference = item.conferenceData;
      if (meetOnly) {
        // "meet" is not a separate Google resource — it is the conference block on
        // an event. Emitting it as its own type keeps the object list honest.
        if (!conference?.conferenceId) continue;
        records.push(
          entity("meet", conference.conferenceId, organizationId, item.organizer?.email ?? null, updatedAt, {
            title: item.summary ?? "(no title)",
            eventId: item.id,
            joinUri: conference.entryPoints?.find((e) => e.entryPointType === "video")?.uri ?? "",
            start: item.start?.dateTime ?? item.start?.date ?? "",
          })
        );
        continue;
      }
      records.push(
        entity("calendar_event", item.id, organizationId, item.organizer?.email ?? null, updatedAt, {
          title: item.summary ?? "(no title)",
          description: item.description ?? "",
          status: item.status ?? "confirmed",
          location: item.location ?? "",
          htmlLink: item.htmlLink ?? "",
          start: item.start?.dateTime ?? item.start?.date ?? "",
          end: item.end?.dateTime ?? item.end?.date ?? "",
          organizer: item.organizer?.email ?? "",
          attendees: (item.attendees ?? []).map((a) => a.email).filter(Boolean),
          hasConference: Boolean(conference?.conferenceId),
        })
      );
    }
    return { records, nextCursor: list.nextPageToken ?? null };
  }

  // ---------------------------------------------------------------- Drive ----

  async function driveFiles(
    organizationId: string,
    objectType: Extract<GoogleWorkspaceObjectType, "drive_file" | "drive_folder" | "doc" | "sheet" | "slide">,
    since: string | null,
    cursor: string | null
  ): Promise<GoogleWorkspaceListPage> {
    const clauses: string[] = ["trashed = false"];
    if (objectType === "drive_folder") clauses.push(`mimeType = '${MIME.folder}'`);
    else if (objectType === "doc") clauses.push(`mimeType = '${MIME.doc}'`);
    else if (objectType === "sheet") clauses.push(`mimeType = '${MIME.sheet}'`);
    else if (objectType === "slide") clauses.push(`mimeType = '${MIME.slide}'`);
    else {
      // drive_file is everything that is not a folder and not already covered by
      // the three editor types, so a file is never emitted twice.
      clauses.push(`mimeType != '${MIME.folder}'`);
      clauses.push(`mimeType != '${MIME.doc}'`);
      clauses.push(`mimeType != '${MIME.sheet}'`);
      clauses.push(`mimeType != '${MIME.slide}'`);
    }
    if (since) clauses.push(`modifiedTime > '${since}'`);

    const list = await retrying(() =>
      apiGet<{
        files?: {
          id: string;
          name?: string;
          mimeType?: string;
          modifiedTime?: string;
          size?: string;
          webViewLink?: string;
          owners?: { emailAddress?: string }[];
          parents?: string[];
          version?: string;
        }[];
        nextPageToken?: string;
      }>(
        `${DRIVE}/files${qs({
          pageSize: PAGE_SIZE,
          pageToken: cursor,
          q: clauses.join(" and "),
          orderBy: "modifiedTime desc",
          fields:
            "nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,owners(emailAddress),parents,version)",
        })}`
      )
    );

    const now = new Date().toISOString();
    return {
      records: (list.files ?? []).map((f) =>
        entity(
          objectType,
          f.id,
          organizationId,
          f.owners?.[0]?.emailAddress ?? null,
          iso(f.modifiedTime, now),
          {
            name: f.name ?? f.id,
            mimeType: f.mimeType ?? "",
            size: Number(f.size ?? 0) || 0,
            webViewLink: f.webViewLink ?? "",
            owner: f.owners?.[0]?.emailAddress ?? "",
            parents: f.parents ?? [],
          },
          Number(f.version ?? 1) || 1
        )
      ),
      nextCursor: list.nextPageToken ?? null,
    };
  }

  // --------------------------------------------------------------- People ----

  async function contacts(organizationId: string, cursor: string | null): Promise<GoogleWorkspaceListPage> {
    const list = await retrying(() =>
      apiGet<{
        connections?: {
          resourceName: string;
          etag?: string;
          names?: { displayName?: string }[];
          emailAddresses?: { value?: string }[];
          phoneNumbers?: { value?: string }[];
          organizations?: { name?: string; title?: string }[];
        }[];
        nextPageToken?: string;
      }>(
        `${PEOPLE}/people/me/connections${qs({
          pageSize: PAGE_SIZE,
          pageToken: cursor,
          personFields: "names,emailAddresses,phoneNumbers,organizations",
        })}`
      )
    );

    const now = new Date().toISOString();
    return {
      records: (list.connections ?? []).map((p) =>
        entity("contact", p.resourceName, organizationId, p.emailAddresses?.[0]?.value ?? null, now, {
          name: p.names?.[0]?.displayName ?? p.resourceName,
          email: p.emailAddresses?.[0]?.value ?? "",
          phone: p.phoneNumbers?.[0]?.value ?? "",
          organization: p.organizations?.[0]?.name ?? "",
          title: p.organizations?.[0]?.title ?? "",
        })
      ),
      nextCursor: list.nextPageToken ?? null,
    };
  }

  // ---------------------------------------------------------------- Tasks ----

  async function taskLists(organizationId: string, cursor: string | null): Promise<GoogleWorkspaceListPage> {
    const list = await retrying(() =>
      apiGet<{ items?: { id: string; title?: string; updated?: string }[]; nextPageToken?: string }>(
        `${TASKS}/users/@me/lists${qs({ maxResults: PAGE_SIZE, pageToken: cursor })}`
      )
    );
    const now = new Date().toISOString();
    return {
      records: (list.items ?? []).map((l) =>
        entity("task_list", l.id, organizationId, null, iso(l.updated, now), { title: l.title ?? l.id })
      ),
      nextCursor: list.nextPageToken ?? null,
    };
  }

  /**
   * Tasks hang off task lists, so one "page" of tasks is a position in two
   * dimensions. The cursor encodes both as `listIndex|pageToken` — opaque to the
   * sync engine, which only ever hands it back.
   */
  async function tasks(
    organizationId: string,
    since: string | null,
    cursor: string | null
  ): Promise<GoogleWorkspaceListPage> {
    const lists = await retrying(() =>
      apiGet<{ items?: { id: string; title?: string }[] }>(`${TASKS}/users/@me/lists${qs({ maxResults: 100 })}`)
    );
    const all = lists.items ?? [];
    if (all.length === 0) return { records: [], nextCursor: null };

    const [rawIndex, rawToken] = (cursor ?? "0|").split("|");
    let index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0 || index >= all.length) index = 0;
    const pageToken = rawToken || null;

    const current = all[index];
    const page = await retrying(() =>
      apiGet<{
        items?: {
          id: string;
          title?: string;
          status?: string;
          due?: string;
          updated?: string;
          notes?: string;
        }[];
        nextPageToken?: string;
      }>(
        `${TASKS}/lists/${encodeURIComponent(current.id)}/tasks${qs({
          maxResults: PAGE_SIZE,
          pageToken,
          updatedMin: since ?? undefined,
          showCompleted: "true",
        })}`
      )
    );

    const now = new Date().toISOString();
    const records = (page.items ?? []).map((t) =>
      entity("task", t.id, organizationId, null, iso(t.updated, now), {
        title: t.title ?? t.id,
        status: t.status ?? "needsAction",
        due: t.due ?? "",
        notes: t.notes ?? "",
        taskListId: current.id,
        taskListTitle: current.title ?? "",
      })
    );

    const nextCursor = page.nextPageToken
      ? `${index}|${page.nextPageToken}`
      : index + 1 < all.length
        ? `${index + 1}|`
        : null;

    return { records, nextCursor };
  }

  // -------------------------------------------------------- Admin SDK -------

  async function directoryUsers(organizationId: string, cursor: string | null): Promise<GoogleWorkspaceListPage> {
    const list = await retrying(() =>
      apiGet<{
        users?: {
          id: string;
          primaryEmail?: string;
          name?: { fullName?: string };
          orgUnitPath?: string;
          suspended?: boolean;
          isAdmin?: boolean;
          lastLoginTime?: string;
        }[];
        nextPageToken?: string;
      }>(
        `${ADMIN}/users${qs({
          customer: "my_customer",
          maxResults: PAGE_SIZE,
          pageToken: cursor,
          orderBy: "email",
        })}`
      )
    );
    const now = new Date().toISOString();
    return {
      records: (list.users ?? []).map((u) =>
        entity("directory_user", u.id, organizationId, u.id, now, {
          name: u.name?.fullName ?? u.primaryEmail ?? u.id,
          email: u.primaryEmail ?? "",
          orgUnitPath: u.orgUnitPath ?? "/",
          status: u.suspended ? "suspended" : "active",
          isAdmin: Boolean(u.isAdmin),
          lastLoginTime: u.lastLoginTime ?? "",
        })
      ),
      nextCursor: list.nextPageToken ?? null,
    };
  }

  async function directoryGroups(organizationId: string, cursor: string | null): Promise<GoogleWorkspaceListPage> {
    const list = await retrying(() =>
      apiGet<{
        groups?: { id: string; name?: string; email?: string; directMembersCount?: string }[];
        nextPageToken?: string;
      }>(`${ADMIN}/groups${qs({ customer: "my_customer", maxResults: PAGE_SIZE, pageToken: cursor })}`)
    );
    const now = new Date().toISOString();
    return {
      records: (list.groups ?? []).map((g) =>
        entity("directory_group", g.id, organizationId, null, now, {
          name: g.name ?? g.email ?? g.id,
          email: g.email ?? "",
          memberCount: Number(g.directMembersCount ?? 0) || 0,
        })
      ),
      nextCursor: list.nextPageToken ?? null,
    };
  }

  async function orgUnits(organizationId: string): Promise<GoogleWorkspaceListPage> {
    const list = await retrying(() =>
      apiGet<{ organizationUnits?: { orgUnitId: string; name?: string; orgUnitPath?: string; description?: string }[] }>(
        `${ADMIN}/customer/my_customer/orgunits${qs({ type: "all" })}`
      )
    );
    const now = new Date().toISOString();
    return {
      // orgunits.list returns the whole tree in one response; there is no paging.
      records: (list.organizationUnits ?? []).map((o) =>
        entity("organizational_unit", o.orgUnitId, organizationId, null, now, {
          name: o.name ?? o.orgUnitPath ?? o.orgUnitId,
          orgUnitPath: o.orgUnitPath ?? "/",
          description: o.description ?? "",
        })
      ),
      nextCursor: null,
    };
  }

  // --------------------------------------------------------------- client ----

  return {
    async authenticate(input) {
      if (input.accessToken) accessToken = input.accessToken;
      if (input.domain) domain = input.domain;
      try {
        const me = await retrying(() =>
          apiGet<{ email?: string; hd?: string }>(USERINFO)
        );
        if (!domain) domain = me.hd ?? (me.email?.split("@")[1] ?? "");
        let domains: GoogleWorkspaceDomain[] = [];
        try {
          domains = await this.listDomains(accessToken);
        } catch {
          // Admin SDK needs a super-admin. A user-consent connection is still a
          // valid connection; it just cannot enumerate the customer's domains.
          domains = domain
            ? [{ domain, customerId: "", displayName: domain, adminEmail: me.email ?? "" }]
            : [];
        }
        const session: GoogleWorkspaceAuthSession = {
          accessToken,
          refreshToken: refreshToken ?? "",
          expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
          domain,
          consentType: input.consentType ?? "user",
          domains,
        };
        return { ok: true, session };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },

    async refreshToken(token) {
      refreshToken = token || refreshToken;
      const result = await exchangeRefreshToken();
      if (!result.ok) return { ok: false, error: result.error };
      return {
        ok: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? undefined,
        expiresAt: result.expiresAt,
      };
    },

    async listDomains(token) {
      if (token) accessToken = token;
      const list = await retrying(() =>
        apiGet<{ domains?: { domainName: string; isPrimary?: boolean }[] }>(
          `${ADMIN}/customer/my_customer/domains`
        )
      );
      return (list.domains ?? []).map((d) => ({
        domain: d.domainName,
        customerId: "my_customer",
        displayName: d.domainName,
        adminEmail: "",
      }));
    },

    async health() {
      const started = Date.now();
      try {
        await apiGet<unknown>(`${GMAIL}/users/me/profile`);
        return { ok: true, latencyMs: Date.now() - started, rateLimitRemaining };
      } catch {
        return { ok: false, latencyMs: Date.now() - started, rateLimitRemaining };
      }
    },

    async list(organizationId, objectType, since, cursor) {
      switch (objectType) {
        case "message":
          return gmailMessages(organizationId, since ?? null, cursor ?? null);
        case "thread":
          return gmailThreads(organizationId, cursor ?? null);
        case "label":
          return gmailLabels(organizationId);
        case "attachment":
          // Attachments are emitted alongside their message; listing them on their
          // own would mean walking every message a second time.
          return { records: [], nextCursor: null };
        case "calendar_event":
          return calendarEvents(organizationId, since ?? null, cursor ?? null, false);
        case "meet":
          return calendarEvents(organizationId, since ?? null, cursor ?? null, true);
        case "drive_file":
        case "drive_folder":
        case "doc":
        case "sheet":
        case "slide":
          return driveFiles(organizationId, objectType, since ?? null, cursor ?? null);
        case "contact":
          return contacts(organizationId, cursor ?? null);
        case "task_list":
          return taskLists(organizationId, cursor ?? null);
        case "task":
          return tasks(organizationId, since ?? null, cursor ?? null);
        case "directory_user":
          return directoryUsers(organizationId, cursor ?? null);
        case "directory_group":
          return directoryGroups(organizationId, cursor ?? null);
        case "organizational_unit":
          return orgUnits(organizationId);
        default: {
          // Exhaustiveness guard: a new object type added to the union lands here
          // as a type error at build time rather than silently syncing nothing.
          const never: never = objectType;
          throw new Error(`Unhandled Google Workspace object type: ${String(never)}`);
        }
      }
    },
  };
}
