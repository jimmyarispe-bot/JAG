/**
 * Slice 2.2 — authoring polish (preview, sections, publish summary, token rotate).
 */

import { describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import {
  LISTENING_EMPTY_COPY,
  buildSurveyPreviewModel,
  estimateCompletionMinutes,
  moveIdInOrder,
  newListeningSectionId,
  parseListeningSections,
  reorderSections,
  serializeListeningSections,
  validateQuestionDraft,
} from "@/lib/platform/listening/authoring";
import {
  regenerateListeningCampaignToken,
  updateListeningVersionSections,
} from "@/lib/platform/listening/repository";
import { ListeningPublishDialog } from "@/components/jag/command-center/listening/ListeningPublishDialog";
import { ListeningSurveyPreview } from "@/components/jag/command-center/listening/ListeningSurveyPreview";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const ORG = TEST_UUIDS.organization;
const VERSION = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CAMPAIGN = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

describe("Listening polish — preview rendering", () => {
  it("builds numbered preview with sections and estimate", () => {
    const sections = [
      {
        id: "s1",
        title: "Culture",
        description: "How we work",
        displayOrder: 1,
      },
    ];
    const questions = [
      {
        id: "q1",
        prompt: "Energy this week?",
        help_text: "Be honest",
        required: true,
        question_type: "likert",
        display_order: 1,
        config: {
          sectionId: "s1",
          likertLowLabel: "Low",
          likertHighLabel: "High",
        },
        options: [
          { id: "o1", label: "1", option_key: "1" },
          { id: "o2", label: "5", option_key: "5" },
        ],
      },
      {
        id: "q2",
        prompt: "Anything else?",
        help_text: "",
        required: false,
        question_type: "long_text",
        display_order: 2,
        config: { placeholder: "Optional notes" },
        options: [],
      },
    ];

    const model = buildSurveyPreviewModel({
      title: "Staff pulse",
      introduction: "Welcome",
      sections,
      questions,
    });
    expect(model.questionCount).toBe(2);
    expect(model.estimatedMinutes).toBeGreaterThanOrEqual(1);
    expect(model.blocks.some((b) => b.section?.title === "Culture")).toBe(true);
    expect(model.blocks.flatMap((b) => b.questions).map((q) => q.number)).toEqual([
      1, 2,
    ]);

    const html = renderToStaticMarkup(
      createElement(ListeningSurveyPreview, {
        title: "Staff pulse",
        introduction: "Welcome",
        sections,
        questions,
      })
    );
    expect(html).toContain("listening-survey-preview");
    expect(html).toContain("Energy this week?");
    expect(html).toContain("Preview · read only");
    expect(html).toContain("Submit (preview only)");
  });
});

describe("Listening polish — publish confirmation", () => {
  it("renders immutability copy and summary counts", () => {
    const html = renderToStaticMarkup(
      createElement(ListeningPublishDialog, {
        open: true,
        pending: false,
        summary: {
          questionCount: 4,
          sectionCount: 2,
          estimatedMinutes: 3,
          campaigns: [{ id: "c1", title: "Spring", status: "open" }],
        },
        onCancel: () => undefined,
        onConfirm: () => undefined,
      })
    );
    expect(html).toContain("listening-publish-dialog");
    expect(html).toContain("immutable");
    expect(html).toContain("4");
    expect(html).toContain("Spring");
    expect(html).toContain("listening-publish-confirm");
  });

  it("hides dialog when closed", () => {
    const html = renderToStaticMarkup(
      createElement(ListeningPublishDialog, {
        open: false,
        pending: false,
        summary: {
          questionCount: 0,
          sectionCount: 0,
          estimatedMinutes: 0,
          campaigns: [],
        },
        onCancel: () => undefined,
        onConfirm: () => undefined,
      })
    );
    expect(html).toBe("");
  });
});

describe("Listening polish — question ordering", () => {
  it("moves ids up and down without wrapping", () => {
    expect(moveIdInOrder(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveIdInOrder(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
    expect(moveIdInOrder(["a", "b", "c"], "a", "up")).toEqual(["a", "b", "c"]);
    expect(estimateCompletionMinutes([{ question_type: "long_text" }])).toBe(1);
  });
});

describe("Listening polish — section management", () => {
  it("serializes sections into version metadata shape", () => {
    const id = newListeningSectionId();
    const packed = serializeListeningSections([
      { id, title: "A", description: "desc", displayOrder: 9 },
    ]);
    const parsed = parseListeningSections(packed);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.title).toBe("A");
    expect(parsed[0]?.displayOrder).toBe(1);
  });

  it("reorders and persists sections on draft versions", async () => {
    const sections = [
      { id: "s1", title: "One", description: "", displayOrder: 1 },
      { id: "s2", title: "Two", description: "", displayOrder: 2 },
    ];
    const moved = reorderSections(sections, "s2", "up");
    expect(moved.map((s) => s.id)).toEqual(["s2", "s1"]);

    let saved: unknown = null;
    const db = createMockSupabase(({ table, operation, payload }) => {
      if (table === "listening_instrument_versions" && operation === "maybeSingle") {
        if (payload && typeof payload === "object" && "metadata" in payload) {
          saved = (payload as { metadata: unknown }).metadata;
          return {
            data: { id: VERSION, metadata: saved, status: "draft" },
            error: null,
          };
        }
        return {
          data: {
            id: VERSION,
            organization_id: ORG,
            instrument_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            version_no: 1,
            status: "draft",
            published_at: null,
            created_by: null,
            created_at: "2026-01-01T00:00:00Z",
            metadata: { sections },
          },
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });

    const result = await updateListeningVersionSections(
      db,
      ORG,
      VERSION,
      moved
    );
    expect(result.map((s) => s.id)).toEqual(["s2", "s1"]);
    expect(saved).toEqual(serializeListeningSections(moved));
  });
});

describe("Listening polish — campaign token regeneration", () => {
  it("mints a new plaintext token and updates hash", async () => {
    const hashes: string[] = [];
    const db = createMockSupabase(({ table, operation, payload }) => {
      if (table === "listening_campaigns" && operation === "maybeSingle") {
        if (payload && typeof payload === "object" && "public_token_hash" in payload) {
          hashes.push(String((payload as { public_token_hash: string }).public_token_hash));
          return { data: { id: CAMPAIGN }, error: null };
        }
        return {
          data: {
            id: CAMPAIGN,
            organization_id: ORG,
            initiative_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            instrument_version_id: VERSION,
            title: "Spring",
            introduction: "",
            privacy_statement: "",
            status: "open",
            privacy_mode: "anonymous",
            opens_at: null,
            closes_at: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
            public_token_hash: "\\x00",
          },
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });

    const result = await regenerateListeningCampaignToken(db, ORG, CAMPAIGN);
    expect(result.campaignId).toBe(CAMPAIGN);
    expect(result.publicToken.length).toBeGreaterThanOrEqual(32);
    expect(result.publicUrl).toBe(`/listen/${result.publicToken}`);
    expect(hashes[0]?.startsWith("\\x")).toBe(true);
  });
});

describe("Listening polish — empty states + validation", () => {
  it("provides guided empty-state copy for each surface", () => {
    for (const key of [
      "initiatives",
      "instruments",
      "versions",
      "campaigns",
      "questions",
    ] as const) {
      expect(LISTENING_EMPTY_COPY[key].title.length).toBeGreaterThan(5);
      expect(LISTENING_EMPTY_COPY[key].description.length).toBeGreaterThan(20);
      expect(LISTENING_EMPTY_COPY[key].action.length).toBeGreaterThan(3);
    }
  });

  it("validates choice questions and numeric bounds", () => {
    expect(
      validateQuestionDraft({
        prompt: "Pick",
        questionType: "single_choice",
        options: [{ label: "Only one" }],
      }).ok
    ).toBe(false);
    expect(
      validateQuestionDraft({
        prompt: "Pick",
        questionType: "single_choice",
        options: [{ label: "A" }, { label: "B" }],
      })
    ).toEqual({ ok: true });
    expect(
      validateQuestionDraft({
        prompt: "Score",
        questionType: "numeric",
        config: { min: 10, max: 1 },
      }).ok
    ).toBe(false);
  });
});
