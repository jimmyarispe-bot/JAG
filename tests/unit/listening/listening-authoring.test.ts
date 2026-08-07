/**
 * Slice 2.1 — Listening authoring workspace (repository + action gates).
 * Mocked Supabase — no Production DB.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import {
  addListeningQuestion,
  createListeningCampaignWithToken,
  createListeningInitiative,
  createListeningInstrument,
  createListeningInstrumentVersion,
  deleteListeningInstrument,
  publishListeningInstrumentVersion,
  updateListeningInitiative,
  updateListeningQuestion,
} from "@/lib/platform/listening/repository";
import { LISTENING_V1_QUESTION_TYPES } from "@/lib/platform/listening/types";
import { permissionGroupsForRole } from "@/lib/platform/identity/permission-groups";

const ORG = TEST_UUIDS.organization;
const INITIATIVE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INSTRUMENT = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VERSION = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const QUESTION = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const CAMPAIGN = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

describe("Listening authoring — initiative CRUD", () => {
  it("creates and updates an initiative in org scope", async () => {
    const inserts: unknown[] = [];
    const updates: unknown[] = [];
    const db = createMockSupabase(({ table, operation, payload, filters }) => {
      if (table === "listening_initiatives" && operation === "single") {
        inserts.push(payload);
        return {
          data: {
            id: INITIATIVE,
            organization_id: ORG,
            title: (payload as { title: string }).title,
            purpose: (payload as { purpose: string }).purpose,
            status: "active",
            created_by: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
            archived_at: null,
          },
          error: null,
        };
      }
      if (table === "listening_initiatives" && operation === "maybeSingle") {
        updates.push(payload);
        expect(filters.organization_id).toBe(ORG);
        expect(filters.id).toBe(INITIATIVE);
        return {
          data: {
            id: INITIATIVE,
            organization_id: ORG,
            title: (payload as { title: string }).title,
            purpose: (payload as { purpose: string }).purpose,
            status: "active",
            updated_at: "2026-01-02T00:00:00Z",
          },
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });

    const created = await createListeningInitiative(db, {
      organizationId: ORG,
      title: "Culture Pulse",
      purpose: "Signal",
      status: "active",
    });
    expect(created.id).toBe(INITIATIVE);
    expect(inserts).toHaveLength(1);

    const updated = await updateListeningInitiative(db, {
      organizationId: ORG,
      initiativeId: INITIATIVE,
      title: "Culture Pulse Q3",
      purpose: "Updated",
    });
    expect(updated.title).toBe("Culture Pulse Q3");
    expect(updates).toHaveLength(1);
  });
});

describe("Listening authoring — instrument CRUD", () => {
  it("creates instrument and rejects delete when published versions exist", async () => {
    const db = createMockSupabase(({ table, operation, payload, filters }) => {
      if (table === "listening_instruments" && operation === "single") {
        return {
          data: {
            id: INSTRUMENT,
            organization_id: ORG,
            initiative_id: INITIATIVE,
            title: (payload as { title: string }).title,
            description: "",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        };
      }
      if (table === "listening_instrument_versions" && operation === "select") {
        expect(filters.instrument_id).toBe(INSTRUMENT);
        return {
          data: [
            {
              id: VERSION,
              organization_id: ORG,
              instrument_id: INSTRUMENT,
              version_no: 1,
              status: "published",
              published_at: "2026-01-02T00:00:00Z",
              created_by: null,
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });

    const instrument = await createListeningInstrument(db, {
      organizationId: ORG,
      initiativeId: INITIATIVE,
      title: "Staff Pulse",
    });
    expect(instrument.id).toBe(INSTRUMENT);

    await expect(
      deleteListeningInstrument(db, ORG, INSTRUMENT)
    ).rejects.toThrow("listening_instrument_has_published_versions");
  });
});

describe("Listening authoring — draft lifecycle + publish", () => {
  it("creates draft, allows question on draft, publishes with questions", async () => {
    let versionStatus = "draft";
    const db = createMockSupabase(({ table, operation, payload, filters }) => {
      if (table === "listening_instrument_versions" && operation === "select") {
        return { data: [], error: null };
      }
      if (table === "listening_instrument_versions" && operation === "single") {
        return {
          data: {
            id: VERSION,
            organization_id: ORG,
            instrument_id: INSTRUMENT,
            version_no: 1,
            status: "draft",
            published_at: null,
            created_by: null,
            created_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        };
      }
      if (
        table === "listening_instrument_versions" &&
        operation === "maybeSingle" &&
        !payload
      ) {
        return {
          data: {
            id: VERSION,
            organization_id: ORG,
            instrument_id: INSTRUMENT,
            version_no: 1,
            status: versionStatus,
            published_at: null,
            created_by: null,
            created_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        };
      }
      if (
        table === "listening_instrument_versions" &&
        operation === "maybeSingle" &&
        payload &&
        typeof payload === "object" &&
        "status" in payload
      ) {
        versionStatus = String((payload as { status: string }).status);
        return {
          data: {
            id: VERSION,
            status: versionStatus,
            published_at: (payload as { published_at?: string }).published_at,
            version_no: 1,
            instrument_id: INSTRUMENT,
          },
          error: null,
        };
      }
      if (table === "listening_questions" && operation === "select") {
        return {
          data: [
            {
              id: QUESTION,
              organization_id: ORG,
              instrument_version_id: VERSION,
              question_key: "q1",
              question_type: "short_text",
              prompt: "How are you?",
              help_text: "",
              required: true,
              display_order: 1,
              config: {},
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
          error: null,
        };
      }
      if (table === "listening_question_options" && operation === "select") {
        return { data: [], error: null };
      }
      if (table === "listening_questions" && operation === "single") {
        return {
          data: {
            id: QUESTION,
            organization_id: ORG,
            instrument_version_id: VERSION,
            question_key: "q1",
            question_type: (payload as { question_type: string }).question_type,
            prompt: (payload as { prompt: string }).prompt,
            required: true,
            display_order: 1,
          },
          error: null,
        };
      }
      return {
        data: null,
        error: {
          message: `unexpected ${table}/${operation} filters=${JSON.stringify(filters)}`,
        },
      };
    });

    const draft = await createListeningInstrumentVersion(db, {
      organizationId: ORG,
      instrumentId: INSTRUMENT,
      status: "draft",
    });
    expect(draft.status).toBe("draft");

    const q = await addListeningQuestion(db, {
      organizationId: ORG,
      instrumentVersionId: VERSION,
      questionType: "short_text",
      prompt: "How are you?",
    });
    expect(q.id).toBe(QUESTION);

    const published = await publishListeningInstrumentVersion(db, ORG, VERSION);
    expect(published.status).toBe("published");
  });

  it("refuses publish when version has no questions", async () => {
    const db = createMockSupabase(({ table, operation }) => {
      if (table === "listening_questions" && operation === "select") {
        return { data: [], error: null };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });
    await expect(
      publishListeningInstrumentVersion(db, ORG, VERSION)
    ).rejects.toThrow("listening_version_empty");
  });

  it("locks question edits on published versions", async () => {
    const db = createMockSupabase(({ table, operation }) => {
      if (table === "listening_questions" && operation === "maybeSingle") {
        return {
          data: {
            id: QUESTION,
            instrument_version_id: VERSION,
          },
          error: null,
        };
      }
      if (table === "listening_instrument_versions" && operation === "maybeSingle") {
        return {
          data: {
            id: VERSION,
            organization_id: ORG,
            instrument_id: INSTRUMENT,
            version_no: 1,
            status: "published",
            published_at: "2026-01-02T00:00:00Z",
            created_by: null,
            created_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });

    await expect(
      updateListeningQuestion(db, {
        organizationId: ORG,
        questionId: QUESTION,
        prompt: "Changed",
      })
    ).rejects.toThrow("listening_instrument_version_locked");
  });
});

describe("Listening authoring — campaign creation", () => {
  it("requires published version and returns plaintext token once", async () => {
    const db = createMockSupabase(({ table, operation, payload }) => {
      if (table === "listening_instrument_versions" && operation === "maybeSingle") {
        return {
          data: {
            id: VERSION,
            organization_id: ORG,
            instrument_id: INSTRUMENT,
            version_no: 1,
            status: "published",
            published_at: "2026-01-02T00:00:00Z",
            created_by: null,
            created_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        };
      }
      if (table === "listening_campaigns" && operation === "single") {
        const row = payload as { public_token_hash: string; privacy_mode: string };
        expect(row.public_token_hash.startsWith("\\x")).toBe(true);
        expect(row.privacy_mode).toBe("anonymous");
        return {
          data: {
            id: CAMPAIGN,
            organization_id: ORG,
            initiative_id: INITIATIVE,
            instrument_version_id: VERSION,
            title: "Spring pulse",
            status: "open",
            privacy_mode: "anonymous",
            opens_at: "2026-01-03T00:00:00Z",
            closes_at: null,
            created_at: "2026-01-03T00:00:00Z",
          },
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });

    const { campaign, publicToken } = await createListeningCampaignWithToken(db, {
      organizationId: ORG,
      initiativeId: INITIATIVE,
      instrumentVersionId: VERSION,
      title: "Spring pulse",
      privacyMode: "anonymous",
    });
    expect(campaign.id).toBe(CAMPAIGN);
    expect(publicToken.length).toBeGreaterThanOrEqual(32);
  });

  it("rejects campaign against draft version", async () => {
    const db = createMockSupabase(({ table, operation }) => {
      if (table === "listening_instrument_versions" && operation === "maybeSingle") {
        return {
          data: {
            id: VERSION,
            organization_id: ORG,
            instrument_id: INSTRUMENT,
            version_no: 1,
            status: "draft",
            published_at: null,
            created_by: null,
            created_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });
    await expect(
      createListeningCampaignWithToken(db, {
        organizationId: ORG,
        initiativeId: INITIATIVE,
        instrumentVersionId: VERSION,
        title: "Nope",
      })
    ).rejects.toThrow("listening_campaign_requires_published_version");
  });
});

describe("Listening authoring — permissions", () => {
  it("JAG_ORG_ADMIN can manage Listening; authoring V1 types are fixed", () => {
    const groups = permissionGroupsForRole("JAG_ORG_ADMIN");
    expect(groups).toContain("JAG_ORG_ACCESS");
    expect(LISTENING_V1_QUESTION_TYPES).toContain("likert");
    expect(LISTENING_V1_QUESTION_TYPES).not.toContain("matrix");
  });

  it("createInitiativeAction denies without LISTENING_MANAGE", async () => {
    vi.resetModules();
    vi.doMock("@/lib/jag-command-center/listening/access", () => ({
      requireListeningManage: async () => ({
        ok: false as const,
        error: "LISTENING_MANAGE required.",
      }),
    }));
    const { createInitiativeAction } = await import(
      "@/lib/jag-command-center/listening/actions"
    );
    const fd = new FormData();
    fd.set("organizationId", ORG);
    fd.set("title", "Denied");
    const result = await createInitiativeAction(fd);
    expect(result).toEqual({
      ok: false,
      error: "LISTENING_MANAGE required.",
    });
  });
});

describe("Listening authoring — empty publish guard smoke", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/jag-command-center/listening/access");
  });

  it("export surface includes authoring helpers", async () => {
    const mod = await import("@/lib/platform/listening");
    expect(typeof mod.createListeningInitiative).toBe("function");
    expect(typeof mod.publishListeningInstrumentVersion).toBe("function");
    expect(typeof mod.createListeningCampaignWithToken).toBe("function");
    expect(mod.LISTENING_V1_QUESTION_TYPES.length).toBe(6);
  });
});
