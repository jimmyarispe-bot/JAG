/**
 * Local HeyGen tooling tests — all HeyGen HTTP calls are mocked.
 */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildCreateVideoRequest,
  HeyGenApiError,
  HeyGenClient,
  HEYGEN_MAX_PAGINATION_PAGES,
} from "../../../scripts/heygen/client";
import {
  HeyGenConfigError,
  requireHeyGenRuntimeConfig,
} from "../../../scripts/heygen/config";
import { generateJagVideos } from "../../../scripts/heygen/generate";
import {
  ManifestValidationError,
  validateJagVideoManifest,
} from "../../../scripts/heygen/manifest";
import { redactSecrets } from "../../../scripts/heygen/redact";
import {
  HeyGenDiscoveryError,
  discoverHeyGenAssets,
  findExactNameMatches,
  discoverPrivateAvatarGroups,
  formatCandidateAvatarInspectionReport,
  formatDiscoverAssetsReport,
  formatMissingMrJagGroupDiagnostic,
  formatPrivateAvatarGroupsReport,
  inspectCandidateAvatarLooks,
  requireHeyGenApiKey,
  resolveMrJagAvatar,
  resolveSawyerVoice,
} from "../../../scripts/heygen/discover";
import { shouldSkipSuccessful } from "../../../scripts/heygen/state";
import type { GenerationRecord } from "../../../scripts/heygen/types";

const validManifest = {
  version: 1 as const,
  brand: {
    writtenInstructor: "Mr. Jag" as const,
    writtenProduct: "The Jag" as const,
  },
  videos: [
    {
      id: "jag-001",
      title: "Welcome to The Jag",
      script: "Hello — I'm Mr. J-A-G. Welcome to The Jag.",
      enabled: true,
    },
    {
      id: "jag-003",
      title: "What The Jag Does",
      script: "Hello — I'm Mr. J-A-G.",
      enabled: false,
    },
  ],
};

describe("HeyGen local video tool", () => {
  it("validates a well-formed manifest", () => {
    const manifest = validateJagVideoManifest(validManifest);
    expect(manifest.videos).toHaveLength(2);
    expect(manifest.brand.writtenInstructor).toBe("Mr. Jag");
  });

  it("rejects malformed manifests", () => {
    expect(() => validateJagVideoManifest({})).toThrow(ManifestValidationError);
    expect(() =>
      validateJagVideoManifest({
        ...validManifest,
        brand: { writtenInstructor: "MR. JAG", writtenProduct: "The Jag" },
      })
    ).toThrow(/brand/);
  });

  it("requires HEYGEN_API_KEY (and avatar/voice IDs)", () => {
    expect(() => requireHeyGenRuntimeConfig({})).toThrow(HeyGenConfigError);
    expect(() =>
      requireHeyGenRuntimeConfig({ HEYGEN_API_KEY: "secret-key" })
    ).toThrow(/HEYGEN_AVATAR_ID/);
    expect(() =>
      requireHeyGenRuntimeConfig({
        HEYGEN_API_KEY: "secret-key",
        HEYGEN_AVATAR_ID: "avatar-1",
      })
    ).toThrow(/HEYGEN_VOICE_ID/);
  });

  it("builds create requests with approved Avatar IV + 1080p settings", () => {
    const request = buildCreateVideoRequest({
      avatarId: "avatar-look-1",
      voiceId: "voice-sawyer-1",
      title: "Welcome to The Jag",
      script: "Hello — I'm Mr. J-A-G.",
    });
    expect(request).toEqual({
      type: "avatar",
      avatar_id: "avatar-look-1",
      voice_id: "voice-sawyer-1",
      title: "Welcome to The Jag",
      script: "Hello — I'm Mr. J-A-G.",
      resolution: "1080p",
      engine: { type: "avatar_iv" },
      voice_settings: { speed: 1.07 },
    });
  });

  it("redacts API keys from logged structures", () => {
    const redacted = redactSecrets(
      {
        authorization: "Bearer super-secret",
        "x-api-key": "super-secret",
        nested: { note: "key=super-secret" },
      },
      "super-secret"
    ) as Record<string, unknown>;
    expect(JSON.stringify(redacted)).not.toContain("super-secret");
    expect(redacted.authorization).toBe("[REDACTED]");
  });

  it("parses successful create + status responses", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { video_id: "vid_123" } }), {
          status: 200,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              status: "completed",
              video_url: "https://example.com/video.mp4",
            },
          }),
          { status: 200 }
        )
      );

    const client = new HeyGenClient({
      apiKey: "test-key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const created = await client.createAvatarVideo({
      avatarId: "a",
      voiceId: "v",
      title: "t",
      script: "s",
    });
    expect(created.videoId).toBe("vid_123");
    const status = await client.getVideoStatus("vid_123");
    expect(status.status).toBe("completed");
    expect(status.videoUrl).toContain("video.mp4");
  });

  it("handles failed API responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "bad request" }), { status: 400 })
    );
    const client = new HeyGenClient({
      apiKey: "test-key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(
      client.createAvatarVideo({
        avatarId: "a",
        voiceId: "v",
        title: "t",
        script: "s",
      })
    ).rejects.toBeInstanceOf(HeyGenApiError);
  });

  it("dry-run does not call HeyGen", async () => {
    const dir = mkdtempSync(join(tmpdir(), "heygen-"));
    const manifestPath = join(dir, "manifest.json");
    const statePath = join(dir, "state.json");
    writeFileSync(manifestPath, JSON.stringify(validManifest), "utf8");
    const fetchImpl = vi.fn();

    const result = await generateJagVideos(
      {
        manifestPath,
        statePath,
        dryRun: true,
        force: false,
        poll: true,
        pollIntervalMs: 1,
        pollTimeoutMs: 10,
      },
      {
        client: new HeyGenClient({
          apiKey: "unused",
          fetchImpl: fetchImpl as unknown as typeof fetch,
        }),
      }
    );

    expect(result.dryRun).toBe(1);
    expect(result.processed).toBe(1);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("skips completed videos unless force is set", () => {
    const completed: GenerationRecord = {
      manifestId: "jag-001",
      title: "Welcome to The Jag",
      heygenVideoId: "vid_abc",
      status: "completed",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      videoUrl: "https://example.com/a.mp4",
      failureReason: null,
      dryRun: false,
    };
    expect(shouldSkipSuccessful(completed, false)).toBe(true);
    expect(shouldSkipSuccessful(completed, true)).toBe(false);
  });

  it("idempotency: second generate run skips without API calls", async () => {
    const dir = mkdtempSync(join(tmpdir(), "heygen-"));
    const manifestPath = join(dir, "manifest.json");
    const statePath = join(dir, "state.json");
    writeFileSync(manifestPath, JSON.stringify(validManifest), "utf8");
    writeFileSync(
      statePath,
      JSON.stringify({
        version: 1,
        updatedAt: "2026-01-01T00:00:00.000Z",
        records: {
          "jag-001": {
            manifestId: "jag-001",
            title: "Welcome to The Jag",
            heygenVideoId: "vid_existing",
            status: "completed",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            videoUrl: "https://example.com/a.mp4",
            failureReason: null,
            dryRun: false,
          },
        },
      }),
      "utf8"
    );

    const fetchImpl = vi.fn();
    const result = await generateJagVideos(
      {
        manifestPath,
        statePath,
        dryRun: false,
        force: false,
        poll: true,
        pollIntervalMs: 1,
        pollTimeoutMs: 10,
      },
      {
        config: {
          apiKey: "test-key",
          avatarId: "avatar-1",
          voiceId: "voice-1",
          baseUrl: "https://api.heygen.com",
        },
        client: new HeyGenClient({
          apiKey: "test-key",
          fetchImpl: fetchImpl as unknown as typeof fetch,
        }),
      }
    );

    expect(result.skipped).toBe(1);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires API key for discovery", () => {
    expect(() => requireHeyGenApiKey({})).toThrow(HeyGenDiscoveryError);
  });

  it("matches Mr. Jag group and Sawyer voice exactly", () => {
    const avatar = resolveMrJagAvatar({
      groups: [
        { id: "ag_1", name: "Mr. Jag", status: "completed" },
        { id: "ag_2", name: "Other", status: "completed" },
      ],
      looks: [
        {
          id: "lk_mr_jag",
          name: "Default",
          avatar_type: "digital_twin",
          status: "completed",
          group_id: "ag_1",
        },
      ],
    });
    expect(avatar.avatarId).toBe("lk_mr_jag");
    expect(avatar.displayName).toBe("Mr. Jag");
    expect(avatar.groupId).toBe("ag_1");

    const voice = resolveSawyerVoice([
      {
        voice_id: "voice_sawyer",
        name: "Sawyer",
        language: "English",
        gender: "male",
        type: "public",
      },
      {
        voice_id: "voice_other",
        name: "Sara",
        language: "English",
        gender: "female",
        type: "public",
      },
    ]);
    expect(voice.voiceId).toBe("voice_sawyer");
    expect(findExactNameMatches([{ name: "Mr. Jag" }], "Mr. Jag")).toHaveLength(
      1
    );
    expect(findExactNameMatches([{ name: "mr. jag" }], "Mr. Jag")).toHaveLength(
      0
    );
    expect(findExactNameMatches([{ name: "MR. JAG" }], "Mr. Jag")).toHaveLength(
      0
    );
  });

  it("fails clearly when Mr. Jag group is missing (no look guessing)", () => {
    expect(() =>
      resolveMrJagAvatar({
        groups: [{ id: "ag_1", name: "Someone Else", status: "completed" }],
        looks: [
          {
            id: "lk_fake",
            name: "Mr. Jag",
            avatar_type: "avatar",
            group_id: "ag_1",
          },
        ],
      })
    ).toThrow(/No exact Mr\. Jag group found\. Available avatar groups:/);
    expect(() => resolveSawyerVoice([{ voice_id: "v1", name: "Sara" }])).toThrow(
      /Voice not found/
    );
  });

  it("lists available avatar groups with IDs and highlights Jared as unverified candidate", () => {
    const message = formatMissingMrJagGroupDiagnostic([
      {
        id: "ag_digital",
        name: "Digital Twin A",
        ownership: "private",
      },
      { id: "ag_jared", name: "Jared" },
      { id: "ag_host", name: "Office Host" },
    ]);
    expect(message).toContain(
      "Could not find an exact HeyGen avatar group named 'Mr. Jag'. No unscoped looks scan will be performed."
    );
    expect(message).toContain(
      "No exact Mr. Jag group found. Available avatar groups:"
    );
    expect(message).toContain(
      "- Digital Twin A group_id=ag_digital ownership=private"
    );
    expect(message).toContain(
      "- Jared group_id=ag_jared — CANDIDATE ONLY — NOT VERIFIED AS MR. JAG"
    );
    expect(message).toContain("- Office Host group_id=ag_host");
    expect(message).not.toContain("test-key");
    expect(message).not.toMatch(/authorization/i);
    expect(message).not.toMatch(/x-api-key/i);
    expect(formatMissingMrJagGroupDiagnostic([])).toContain("(none)");
  });

  it("does not arbitrarily select among multiple looks without an exact Mr. Jag look", () => {
    expect(() =>
      resolveMrJagAvatar({
        groups: [{ id: "ag_1", name: "Mr. Jag" }],
        looks: [
          {
            id: "lk_a",
            name: "Casual",
            avatar_type: "digital_twin",
            group_id: "ag_1",
          },
          {
            id: "lk_b",
            name: "Formal",
            avatar_type: "digital_twin",
            group_id: "ag_1",
          },
        ],
      })
    ).toThrow(/multiple looks; cannot choose uniquely/);
  });

  it("selects the exact Mr. Jag look when a group has multiple looks", () => {
    const avatar = resolveMrJagAvatar({
      groups: [{ id: "ag_1", name: "Mr. Jag" }],
      looks: [
        {
          id: "lk_other",
          name: "Casual",
          avatar_type: "digital_twin",
          group_id: "ag_1",
        },
        {
          id: "lk_named",
          name: "Mr. Jag",
          avatar_type: "digital_twin",
          group_id: "ag_1",
        },
      ],
    });
    expect(avatar.avatarId).toBe("lk_named");
    expect(avatar.lookName).toBe("Mr. Jag");
  });

  it("reports duplicate exact matches as ambiguity", () => {
    expect(() =>
      resolveMrJagAvatar({
        groups: [
          { id: "ag_1", name: "Mr. Jag" },
          { id: "ag_2", name: "Mr. Jag" },
        ],
        looks: [],
      })
    ).toThrow(/Ambiguous avatar/);
    expect(() =>
      resolveSawyerVoice([
        { voice_id: "v1", name: "Sawyer", language: "English" },
        { voice_id: "v2", name: "Sawyer", language: "Spanish" },
      ])
    ).toThrow(/Ambiguous voice/);
  });

  it("discovery uses GET only, scopes looks by group_id, and never POST /v3/videos", async () => {
    const calls: Array<{ method: string; url: string }> = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ method, url });
      if (url.includes("/v3/avatars/looks")) {
        const parsed = new URL(url);
        expect(parsed.searchParams.get("group_id")).toBe("ag_1");
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "lk_mr_jag",
                name: "Default",
                avatar_type: "digital_twin",
                status: "completed",
                group_id: "ag_1",
              },
            ],
            has_more: false,
          }),
          { status: 200 }
        );
      }
      if (url.includes("/v3/avatars")) {
        return new Response(
          JSON.stringify({
            data: [{ id: "ag_1", name: "Mr. Jag", status: "completed" }],
            has_more: false,
          }),
          { status: 200 }
        );
      }
      if (url.includes("/v3/voices")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                voice_id: "voice_sawyer",
                name: "Sawyer",
                language: "English",
                gender: "male",
                type: "public",
              },
            ],
            has_more: false,
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ message: "unexpected" }), {
        status: 500,
      });
    });

    const listAllAvatarLooksSpy = vi.spyOn(
      HeyGenClient.prototype,
      "listAllAvatarLooks"
    );

    const result = await discoverHeyGenAssets({
      env: { HEYGEN_API_KEY: "test-key" },
      client: new HeyGenClient({
        apiKey: "test-key",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    });

    expect(result.avatar.avatarId).toBe("lk_mr_jag");
    expect(result.avatar.groupId).toBe("ag_1");
    expect(result.voice.voiceId).toBe("voice_sawyer");
    expect(calls.every((c) => c.method === "GET")).toBe(true);
    expect(calls.some((c) => c.url.includes("/v3/videos"))).toBe(false);
    expect(
      calls.some(
        (c) =>
          c.url.includes("/v3/avatars/looks") &&
          !new URL(c.url).searchParams.has("group_id")
      )
    ).toBe(false);
    expect(listAllAvatarLooksSpy).toHaveBeenCalled();
    expect(
      listAllAvatarLooksSpy.mock.calls.every(
        (args) => args[0] && typeof args[0] === "object" && "groupId" in args[0]
      )
    ).toBe(true);
    expect(
      listAllAvatarLooksSpy.mock.calls.some(
        (args) =>
          !args[0] ||
          (typeof args[0] === "object" &&
            !("groupId" in args[0]) &&
            Object.keys(args[0] as object).length === 0)
      )
    ).toBe(false);
    expect(formatDiscoverAssetsReport(result)).toContain("avatar_id: lk_mr_jag");
    expect(formatDiscoverAssetsReport(result)).not.toContain("test-key");

    listAllAvatarLooksSpy.mockRestore();
  });

  it("discovery fails clearly when Mr. Jag group is missing without scanning looks", async () => {
    const calls: Array<{ method: string; url: string }> = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ method, url });
      if (url.includes("/v3/avatars/looks")) {
        return new Response(JSON.stringify({ message: "should not be called" }), {
          status: 500,
        });
      }
      if (url.includes("/v3/avatars")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "ag_someone",
                name: "Someone Else",
                ownership: "private",
              },
              { id: "ag_jared_live", name: "Jared" },
              { id: "ag_2", name: "Office Host" },
            ],
            has_more: false,
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ message: "unexpected" }), {
        status: 500,
      });
    });

    const listAllAvatarLooksSpy = vi.spyOn(
      HeyGenClient.prototype,
      "listAllAvatarLooks"
    );

    let caught: unknown;
    try {
      await discoverHeyGenAssets({
        env: { HEYGEN_API_KEY: "test-key" },
        client: new HeyGenClient({
          apiKey: "test-key",
          fetchImpl: fetchImpl as unknown as typeof fetch,
        }),
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HeyGenDiscoveryError);
    const message = caught instanceof Error ? caught.message : String(caught);
    expect(message).toContain(
      "Could not find an exact HeyGen avatar group named 'Mr. Jag'. No unscoped looks scan will be performed."
    );
    expect(message).toContain(
      "No exact Mr. Jag group found. Available avatar groups:"
    );
    expect(message).toContain(
      "- Someone Else group_id=ag_someone ownership=private"
    );
    expect(message).toContain(
      "- Jared group_id=ag_jared_live — CANDIDATE ONLY — NOT VERIFIED AS MR. JAG"
    );
    expect(message).toContain("- Office Host group_id=ag_2");
    expect(message).not.toContain("test-key");
    expect(message).not.toMatch(/authorization/i);
    expect(message).not.toMatch(/x-api-key/i);

    expect(listAllAvatarLooksSpy).not.toHaveBeenCalled();
    expect(calls.some((c) => c.url.includes("/v3/avatars/looks"))).toBe(false);
    expect(calls.some((c) => c.url.includes("/v3/videos"))).toBe(false);
    expect(calls.every((c) => c.method === "GET")).toBe(true);

    listAllAvatarLooksSpy.mockRestore();
  });

  it("private group discovery sends ownership=private and never calls looks or videos", async () => {
    const calls: Array<{ method: string; url: string }> = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ method, url });
      if (url.includes("/v3/avatars/looks") || url.includes("/v3/videos")) {
        return new Response(JSON.stringify({ message: "should not be called" }), {
          status: 500,
        });
      }
      if (url.includes("/v3/avatars")) {
        const parsed = new URL(url);
        expect(parsed.searchParams.get("ownership")).toBe("private");
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "ag_private_1",
                name: "Office Host",
                ownership: "private",
                status: "completed",
              },
              {
                id: "ag_private_2",
                name: "Mr. JAG",
                status: "completed",
              },
            ],
            has_more: false,
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ message: "unexpected" }), {
        status: 500,
      });
    });

    const listLooksSpy = vi.spyOn(HeyGenClient.prototype, "listAllAvatarLooks");
    const result = await discoverPrivateAvatarGroups({
      env: { HEYGEN_API_KEY: "test-key" },
      client: new HeyGenClient({
        apiKey: "test-key",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    });

    expect(result.groups).toHaveLength(2);
    expect(result.exactMrJagMatches).toHaveLength(0);
    const report = formatPrivateAvatarGroupsReport(result);
    expect(report).toContain("=== PRIVATE HEYGEN AVATAR GROUPS ===");
    expect(report).toContain("Total private groups: 2");
    expect(report).toContain(
      "Office Host | group_id=ag_private_1 | ownership=private | status=completed"
    );
    expect(report).toContain(
      "Mr. JAG | group_id=ag_private_2 | ownership=(not in response) | status=completed"
    );
    expect(report).toContain('No exact "Mr. Jag" private avatar group found.');
    expect(report).toContain("- Mr. JAG | group_id=ag_private_2");
    expect(report).not.toContain("test-key");
    expect(report).not.toMatch(/authorization/i);
    expect(listLooksSpy).not.toHaveBeenCalled();
    expect(calls.every((c) => c.method === "GET")).toBe(true);
    expect(calls.some((c) => c.url.includes("/v3/avatars/looks"))).toBe(false);
    expect(calls.some((c) => c.url.includes("/v3/videos"))).toBe(false);
    expect(
      calls.every((c) => new URL(c.url).searchParams.get("ownership") === "private")
    ).toBe(true);

    listLooksSpy.mockRestore();
  });

  it("candidate inspection scopes looks by Mark/Jared group_id and never POSTs videos", async () => {
    const calls: Array<{ method: string; url: string }> = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      calls.push({ method, url });
      if (url.includes("/v3/avatars/looks")) {
        const parsed = new URL(url);
        const groupId = parsed.searchParams.get("group_id");
        expect(groupId).toBeTruthy();
        const lookName = groupId === "ag_mark" ? "Business" : "Casual";
        return new Response(
          JSON.stringify({
            data: [
              {
                id: groupId === "ag_mark" ? "lk_mark_1" : "lk_jared_1",
                name: lookName,
                avatar_type: "digital_twin",
                status: "completed",
                group_id: groupId,
              },
            ],
            has_more: false,
          }),
          { status: 200 }
        );
      }
      if (url.includes("/v3/avatars")) {
        return new Response(
          JSON.stringify({
            data: [
              { id: "ag_mark", name: "Mark", status: "completed" },
              { id: "ag_jared", name: "Jared", status: "completed" },
              { id: "ag_other", name: "Other", status: "completed" },
            ],
            has_more: false,
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ message: "unexpected" }), {
        status: 500,
      });
    });

    const listAllAvatarLooksSpy = vi.spyOn(
      HeyGenClient.prototype,
      "listAllAvatarLooks"
    );

    const result = await inspectCandidateAvatarLooks({
      env: { HEYGEN_API_KEY: "test-key" },
      client: new HeyGenClient({
        apiKey: "test-key",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    });

    const report = formatCandidateAvatarInspectionReport(result);
    expect(report).toContain("=== HEYGEN CANDIDATE AVATAR INSPECTION ===");
    expect(report).toContain("Candidate: Mark");
    expect(report).toContain("group_id=ag_mark");
    expect(report).toContain('name="Business" look_id=lk_mark_1');
    expect(report).toContain("Candidate: Jared");
    expect(report).toContain("group_id=ag_jared");
    expect(report).toContain(
      "No explicit Mr. Jag look-name match found. Visual verification is still required."
    );
    expect(report).not.toContain("test-key");
    expect(report).not.toMatch(/authorization/i);

    expect(listAllAvatarLooksSpy).toHaveBeenCalledTimes(2);
    expect(
      listAllAvatarLooksSpy.mock.calls.every(
        (args) =>
          args[0] &&
          typeof args[0] === "object" &&
          "groupId" in args[0] &&
          (args[0] as { groupId: string }).groupId
      )
    ).toBe(true);
    expect(
      calls.some(
        (c) =>
          c.url.includes("/v3/avatars/looks") &&
          !new URL(c.url).searchParams.has("group_id")
      )
    ).toBe(false);
    expect(calls.some((c) => c.url.includes("/v3/videos"))).toBe(false);
    expect(calls.every((c) => c.method === "GET")).toBe(true);

    listAllAvatarLooksSpy.mockRestore();
  });

  it("times out hung GET requests with a safe error", async () => {
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            reject(new Error("missing abort signal"));
            return;
          }
          const onAbort = () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          };
          if (signal.aborted) onAbort();
          else signal.addEventListener("abort", onAbort, { once: true });
        })
    );

    const client = new HeyGenClient({
      apiKey: "super-secret-key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      requestTimeoutMs: 40,
    });

    await expect(client.listAllAvatarGroups({ ownership: "private" })).rejects.toMatchObject(
      {
        name: "HeyGenApiError",
        message: expect.stringContaining("timed out after 0.04 seconds"),
      }
    );

    try {
      await client.listAllAvatarGroups({ ownership: "private" });
    } catch (error) {
      expect(error).toBeInstanceOf(HeyGenApiError);
      const message = error instanceof Error ? error.message : String(error);
      expect(message).toContain("/v3/avatars");
      expect(message).not.toContain("super-secret-key");
      expect(JSON.stringify(redactSecrets(error, "super-secret-key"))).not.toContain(
        "super-secret-key"
      );
    }
  });

  it("rejects repeated pagination tokens", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: [{ id: "ag_1", name: "A" }],
          has_more: true,
          next_token: "stuck-token",
        }),
        { status: 200 }
      )
    );

    const client = new HeyGenClient({
      apiKey: "test-key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(client.listAllAvatarGroups()).rejects.toMatchObject({
      name: "HeyGenApiError",
      message: expect.stringContaining("token did not advance"),
    });
  });

  it("enforces a 50-page pagination limit", async () => {
    let page = 0;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      page += 1;
      const url = new URL(String(input));
      const token = url.searchParams.get("token");
      return new Response(
        JSON.stringify({
          data: [{ id: `ag_${page}`, name: `Avatar ${page}` }],
          has_more: true,
          next_token: token ? `${token}-n` : "t1",
        }),
        { status: 200 }
      );
    });

    const client = new HeyGenClient({
      apiKey: "test-key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(client.listAllAvatarGroups()).rejects.toMatchObject({
      name: "HeyGenApiError",
      message: expect.stringContaining(
        `exceeded ${HEYGEN_MAX_PAGINATION_PAGES} pages`
      ),
    });
    expect(page).toBe(HEYGEN_MAX_PAGINATION_PAGES);
  });

  it("allows normal multi-page pagination to succeed", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const token = url.searchParams.get("token");
      if (!token) {
        return new Response(
          JSON.stringify({
            data: [{ id: "ag_1", name: "One" }],
            has_more: true,
            next_token: "page-2",
          }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          data: [{ id: "ag_2", name: "Two" }],
          has_more: false,
          next_token: null,
        }),
        { status: 200 }
      );
    });

    const client = new HeyGenClient({
      apiKey: "test-key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const groups = await client.listAllAvatarGroups();
    expect(groups.map((g) => g.id)).toEqual(["ag_1", "ag_2"]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
