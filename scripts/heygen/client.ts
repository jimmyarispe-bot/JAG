/**
 * Minimal HeyGen API v3 client (native fetch — no extra dependency).
 * Auth header: x-api-key (never logged).
 */

import {
  APPROVED_HEYGEN_SETUP,
  HEYGEN_API_BASE_URL,
  type HeyGenRuntimeConfig,
} from "./config";
import { redactSecrets } from "./redact";
import type {
  HeyGenCreateVideoRequest,
  HeyGenCreateVideoResponse,
  HeyGenVideoStatus,
  HeyGenVideoStatusResponse,
} from "./types";

export class HeyGenApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "HeyGenApiError";
    this.status = status;
    this.body = body;
  }
}

/** Approved Sawyer delivery speed for Jag videos (~7% above default). */
export const APPROVED_VOICE_SPEED = 1.07;

export function buildCreateVideoRequest(input: {
  avatarId: string;
  voiceId: string;
  title: string;
  script: string;
}): HeyGenCreateVideoRequest {
  return {
    type: "avatar",
    avatar_id: input.avatarId,
    script: input.script,
    voice_id: input.voiceId,
    title: input.title,
    resolution: APPROVED_HEYGEN_SETUP.resolution,
    engine: { type: APPROVED_HEYGEN_SETUP.engineType },
    voice_settings: { speed: APPROVED_VOICE_SPEED },
  };
}

function normalizeStatus(value: string | undefined): HeyGenVideoStatus {
  switch (value) {
    case "pending":
    case "processing":
    case "completed":
    case "failed":
      return value;
    default:
      return "unknown";
  }
}

/** Default per-request timeout for HeyGen GET calls. */
export const HEYGEN_GET_TIMEOUT_MS = 30_000;

/** Safety cap for paginated list endpoints. */
export const HEYGEN_MAX_PAGINATION_PAGES = 50;

export class HeyGenClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly requestTimeoutMs: number;

  constructor(options: {
    apiKey: string;
    baseUrl?: string;
    fetchImpl?: typeof fetch;
    /** Override for tests; production default is 30s. */
    requestTimeoutMs?: number;
  }) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? HEYGEN_API_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.requestTimeoutMs = options.requestTimeoutMs ?? HEYGEN_GET_TIMEOUT_MS;
  }

  static fromRuntime(config: HeyGenRuntimeConfig, fetchImpl?: typeof fetch) {
    return new HeyGenClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      fetchImpl,
    });
  }

  private headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
    };
  }

  private async parseJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text.slice(0, 500) };
    }
  }

  private endpointPath(pathWithQuery: string): string {
    return pathWithQuery.split("?")[0] ?? pathWithQuery;
  }

  private async getJson(pathWithQuery: string): Promise<unknown> {
    const endpoint = this.endpointPath(pathWithQuery);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.requestTimeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${pathWithQuery}`, {
        method: "GET",
        headers: this.headers(),
        signal: controller.signal,
      });
      const body = await this.parseJson(response);
      if (response.status === 429) {
        throw new HeyGenApiError(
          "HeyGen rate limit exceeded (429).",
          429,
          redactSecrets(body, this.apiKey)
        );
      }
      if (!response.ok) {
        throw new HeyGenApiError(
          `HeyGen GET ${endpoint} failed (HTTP ${response.status}).`,
          response.status,
          redactSecrets(body, this.apiKey)
        );
      }
      return body;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "AbortError" || controller.signal.aborted)
      ) {
        throw new HeyGenApiError(
          `HeyGen GET ${endpoint} timed out after ${this.requestTimeoutMs / 1000} seconds.`,
          408,
          null
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private async listPaginated<T>(input: {
    path: string;
    query?: Record<string, string | undefined>;
    limit: number;
  }): Promise<T[]> {
    const items: T[] = [];
    let token: string | undefined;
    let pageCount = 0;

    for (;;) {
      pageCount += 1;
      if (pageCount > HEYGEN_MAX_PAGINATION_PAGES) {
        throw new HeyGenApiError(
          `HeyGen pagination exceeded ${HEYGEN_MAX_PAGINATION_PAGES} pages for ${input.path}.`,
          422,
          null
        );
      }

      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(input.query ?? {})) {
        if (value) params.set(key, value);
      }
      params.set("limit", String(input.limit));
      if (token) params.set("token", token);
      const body = (await this.getJson(
        `${input.path}?${params.toString()}`
      )) as {
        data?: T[];
        has_more?: boolean;
        next_token?: string | null;
      };
      const page = Array.isArray(body?.data) ? body.data : [];
      items.push(...page);
      if (!body?.has_more || !body.next_token) break;
      if (token !== undefined && body.next_token === token) {
        throw new HeyGenApiError(
          `HeyGen pagination token did not advance for ${input.path}.`,
          422,
          null
        );
      }
      token = body.next_token;
      if (page.length === 0) break;
    }
    return items;
  }

  /** GET /v3/avatars — read-only avatar groups. */
  async listAllAvatarGroups(input?: {
    ownership?: "public" | "private";
  }): Promise<
    Array<{
      id: string;
      name: string;
      status?: string | null;
      ownership?: string | null;
      looks_count?: number | null;
      preview_image_url?: string | null;
      preview_video_url?: string | null;
    }>
  > {
    return this.listPaginated({
      path: "/v3/avatars",
      query: { ownership: input?.ownership },
      limit: 50,
    });
  }

  /** GET /v3/avatars/looks — look id is avatar_id for video create. */
  async listAllAvatarLooks(input?: {
    ownership?: "public" | "private";
    groupId?: string;
  }): Promise<
    Array<{
      id: string;
      name: string;
      avatar_type: string;
      status?: string | null;
      group_id?: string | null;
      preview_image_url?: string | null;
      preview_video_url?: string | null;
    }>
  > {
    return this.listPaginated({
      path: "/v3/avatars/looks",
      query: {
        ownership: input?.ownership,
        group_id: input?.groupId,
      },
      limit: 50,
    });
  }

  /** GET /v3/voices?type=… — read-only voice pages. */
  async listVoicesByType(type: "public" | "private"): Promise<
    Array<{
      voice_id: string;
      name: string;
      language?: string | null;
      gender?: string | null;
      type?: string | null;
    }>
  > {
    return this.listPaginated({
      path: "/v3/voices",
      query: { type },
      limit: 100,
    });
  }

  /**
   * GET /v3/voices — public then private pages (read-only).
   * Default API type is public; Sawyer is typically a public library voice.
   */
  async listAllVoices(): Promise<
    Array<{
      voice_id: string;
      name: string;
      language?: string | null;
      gender?: string | null;
      type?: string | null;
    }>
  > {
    const publicVoices = await this.listVoicesByType("public");
    const privateVoices = await this.listVoicesByType("private");
    const byId = new Map<string, (typeof publicVoices)[number]>();
    for (const voice of [...publicVoices, ...privateVoices]) {
      if (voice?.voice_id) byId.set(voice.voice_id, voice);
    }
    return [...byId.values()];
  }

  async createAvatarVideo(input: {
    avatarId: string;
    voiceId: string;
    title: string;
    script: string;
  }): Promise<{ videoId: string; request: HeyGenCreateVideoRequest }> {
    const request = buildCreateVideoRequest(input);
    const response = await this.fetchImpl(`${this.baseUrl}/v3/videos`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(request),
    });
    const body = (await this.parseJson(response)) as HeyGenCreateVideoResponse;

    if (response.status === 429) {
      throw new HeyGenApiError(
        "HeyGen rate limit exceeded (429). Retry later.",
        429,
        redactSecrets(body, this.apiKey)
      );
    }
    if (!response.ok) {
      throw new HeyGenApiError(
        `HeyGen create video failed (HTTP ${response.status}).`,
        response.status,
        redactSecrets(body, this.apiKey)
      );
    }

    const videoId = body?.data?.video_id?.trim();
    if (!videoId) {
      throw new HeyGenApiError(
        "HeyGen create video response missing data.video_id.",
        response.status,
        redactSecrets(body, this.apiKey)
      );
    }
    return { videoId, request };
  }

  async getVideoStatus(videoId: string): Promise<{
    status: HeyGenVideoStatus;
    videoUrl: string | null;
    failureMessage: string | null;
  }> {
    const body = (await this.getJson(
      `/v3/videos/${encodeURIComponent(videoId)}`
    )) as HeyGenVideoStatusResponse;

    const status = normalizeStatus(body?.data?.status);
    const failure =
      body?.data?.failure_message?.trim() ||
      body?.data?.failure_code?.trim() ||
      null;
    return {
      status,
      videoUrl: body?.data?.video_url?.trim() || null,
      failureMessage: failure,
    };
  }

  async waitForVideo(input: {
    videoId: string;
    intervalMs: number;
    timeoutMs: number;
    onTick?: (status: HeyGenVideoStatus) => void;
  }): Promise<{
    status: HeyGenVideoStatus;
    videoUrl: string | null;
    failureMessage: string | null;
  }> {
    const started = Date.now();
    while (Date.now() - started < input.timeoutMs) {
      const current = await this.getVideoStatus(input.videoId);
      input.onTick?.(current.status);
      if (current.status === "completed" || current.status === "failed") {
        return current;
      }
      await new Promise((r) => setTimeout(r, input.intervalMs));
    }
    throw new HeyGenApiError(
      `Timed out waiting for HeyGen video ${input.videoId} after ${input.timeoutMs}ms.`,
      408,
      null
    );
  }
}
