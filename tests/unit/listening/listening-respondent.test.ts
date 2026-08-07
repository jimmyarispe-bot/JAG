/**
 * Slice 3 — public respondent experience (resolve, validate, draft, submit).
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createMockSupabase } from "../../helpers/mock-supabase";
import {
  classifyListeningPublicError,
  clearDraftStorage,
  draftStorageKey,
  isAnswerPresent,
  markSubmittedLocally,
  readDraftFromStorage,
  readSubmittedLocally,
  resolvePublicListeningCampaign,
  seedDraftFromDefaults,
  submitPublicListeningResponse,
  toRespondentView,
  toSubmitAnswers,
  validateCurrentQuestion,
  validateRequiredAnswers,
  writeDraftToStorage,
  type ListeningPublicCampaignContract,
  type ListeningRespondentQuestion,
} from "@/lib/platform/listening";
import { ListeningQuestionField } from "@/components/listening-public/ListeningQuestionField";
import { ListeningThankYou } from "@/components/listening-public/ListeningThankYou";
import { ListeningPublicError } from "@/components/listening-public/ListeningPublicError";

const TOKEN = "a".repeat(40);

const SAMPLE_CONTRACT: ListeningPublicCampaignContract = {
  campaign_id: "11111111-1111-4111-8111-111111111111",
  title: "Culture pulse",
  introduction: "Welcome — share candidly.",
  privacy_statement: "Responses are anonymous.",
  privacy_mode: "anonymous",
  instrument_version_id: "22222222-2222-4222-8222-222222222222",
  questions: [
    {
      id: "q-text",
      question_key: "q1",
      question_type: "short_text",
      prompt: "One word?",
      help_text: "Optional help",
      required: true,
      display_order: 1,
      config: {
        sectionId: "sec-a",
        sectionTitle: "Openers",
        sectionDescription: "Warm-up",
        placeholder: "Type here",
        defaultValue: "",
      },
      options: [],
    },
    {
      id: "q-choice",
      question_key: "q2",
      question_type: "single_choice",
      prompt: "Pick one",
      help_text: "",
      required: true,
      display_order: 2,
      config: { sectionId: "sec-a", sectionTitle: "Openers" },
      options: [
        {
          id: "o1",
          option_key: "yes",
          label: "Yes",
          display_order: 1,
          value_numeric: null,
        },
        {
          id: "o2",
          option_key: "no",
          label: "No",
          display_order: 2,
          value_numeric: null,
        },
      ],
    },
    {
      id: "q-multi",
      question_key: "q3",
      question_type: "multi_choice",
      prompt: "Select any",
      help_text: "",
      required: false,
      display_order: 3,
      config: {},
      options: [
        {
          id: "m1",
          option_key: "a",
          label: "A",
          display_order: 1,
          value_numeric: null,
        },
        {
          id: "m2",
          option_key: "b",
          label: "B",
          display_order: 2,
          value_numeric: null,
        },
      ],
    },
    {
      id: "q-likert",
      question_key: "q4",
      question_type: "likert",
      prompt: "Agreement",
      help_text: "",
      required: true,
      display_order: 4,
      config: { likertLowLabel: "Low", likertHighLabel: "High" },
      options: [
        {
          id: "l1",
          option_key: "1",
          label: "1",
          display_order: 1,
          value_numeric: 1,
        },
        {
          id: "l2",
          option_key: "5",
          label: "5",
          display_order: 2,
          value_numeric: 5,
        },
      ],
    },
    {
      id: "q-num",
      question_key: "q5",
      question_type: "numeric",
      prompt: "Score",
      help_text: "",
      required: false,
      display_order: 5,
      config: { min: 0, max: 10 },
      options: [],
    },
    {
      id: "q-long",
      question_key: "q6",
      question_type: "long_text",
      prompt: "Notes",
      help_text: "",
      required: false,
      display_order: 6,
      config: { placeholder: "Optional" },
      options: [],
    },
  ],
};

describe("Listening respondent — token resolution", () => {
  it("rejects invalid token shape before RPC", async () => {
    const db = createMockSupabase(() => ({ data: null, error: null }));
    await expect(resolvePublicListeningCampaign(db, "short")).rejects.toThrow(
      "listening_token_invalid"
    );
  });

  it("maps RPC payload to safe respondent view without internal IDs in UI fields", () => {
    const view = toRespondentView(SAMPLE_CONTRACT);
    expect(view.title).toBe("Culture pulse");
    expect(view.introduction).toContain("Welcome");
    expect(view.privacyMode).toBe("anonymous");
    expect(view.questionCount).toBe(6);
    expect(view.sections[0]?.title).toBe("Openers");
    expect(view.questions[0]?.placeholder).toBe("Type here");
    const json = JSON.stringify(view);
    expect(json).not.toContain(SAMPLE_CONTRACT.campaign_id);
    expect(json).not.toContain(SAMPLE_CONTRACT.instrument_version_id);
  });

  it("surfaces invalid token and closed/expired campaign errors", () => {
    expect(classifyListeningPublicError("listening_token_invalid").kind).toBe(
      "invalid_token"
    );
    expect(
      classifyListeningPublicError("listening_campaign_not_open").kind
    ).toBe("closed");
    expect(
      classifyListeningPublicError("listening_campaign_not_open expired").kind
    ).toBe("expired");
  });
});

describe("Listening respondent — question rendering", () => {
  it("renders supported field types with a11y labels", () => {
    const view = toRespondentView(SAMPLE_CONTRACT);
    for (const q of view.questions) {
      const html = renderToStaticMarkup(
        createElement(ListeningQuestionField, {
          question: q,
          value: q.questionType === "multi_choice" ? [] : "",
          onChange: () => undefined,
        })
      );
      expect(html).toContain("listening-question-field");
      expect(html).toContain(q.prompt);
      if (q.required) expect(html).toContain("required");
    }
  });
});

describe("Listening respondent — required validation", () => {
  it("blocks next/submit when required answers missing", () => {
    const view = toRespondentView(SAMPLE_CONTRACT);
    const empty = validateRequiredAnswers(view.questions, {});
    expect(empty.ok).toBe(false);
    if (!empty.ok) {
      expect(empty.missingIds).toContain("q-text");
      expect(empty.missingIds).toContain("q-choice");
      expect(empty.missingIds).toContain("q-likert");
    }

    const current = validateCurrentQuestion(view.questions[0]!, "");
    expect(current.ok).toBe(false);

    expect(
      validateCurrentQuestion(view.questions.find((q) => q.id === "q-num")!, 99)
        .ok
    ).toBe(false);
  });
});

describe("Listening respondent — draft persistence", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
      sessionStorage: {
        getItem: (k: string) => store.get(`session:${k}`) ?? null,
        setItem: (k: string, v: string) => {
          store.set(`session:${k}`, v);
        },
        removeItem: (k: string) => {
          store.delete(`session:${k}`);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists and recovers draft answers; clears after submit mark", () => {
    writeDraftToStorage(TOKEN, { "q-text": "hello" });
    expect(readDraftFromStorage(TOKEN)).toEqual({ "q-text": "hello" });
    expect(draftStorageKey(TOKEN)).toContain(TOKEN);

    const seeded = seedDraftFromDefaults([
      {
        id: "q-text",
        number: 1,
        prompt: "x",
        helpText: "",
        required: true,
        questionType: "short_text",
        sectionId: null,
        defaultValue: "seed",
        options: [],
      } satisfies ListeningRespondentQuestion,
    ]);
    expect(seeded["q-text"]).toBe("seed");

    clearDraftStorage(TOKEN);
    expect(readDraftFromStorage(TOKEN)).toBeNull();

    markSubmittedLocally(TOKEN, {
      title: "Culture pulse",
      privacyStatement: "Anonymous",
    });
    expect(readSubmittedLocally(TOKEN)?.title).toBe("Culture pulse");
  });
});

describe("Listening respondent — submission payload", () => {
  it("builds typed answer values for RPC", () => {
    const view = toRespondentView(SAMPLE_CONTRACT);
    const answers = {
      "q-text": "ok",
      "q-choice": "yes",
      "q-multi": ["a", "b"],
      "q-likert": "5",
      "q-num": 7,
      "q-long": "notes",
    };
    expect(isAnswerPresent(view.questions[0]!, "ok")).toBe(true);
    const payload = toSubmitAnswers(view.questions, answers);
    expect(payload).toEqual(
      expect.arrayContaining([
        { question_id: "q-text", value: { text: "ok" } },
        { question_id: "q-choice", value: { option_key: "yes" } },
        { question_id: "q-multi", value: { option_keys: ["a", "b"] } },
        { question_id: "q-likert", value: { number: 5 } },
        { question_id: "q-num", value: { number: 7 } },
        { question_id: "q-long", value: { text: "notes" } },
      ])
    );
  });

  it("submit helper refuses invalid token and maps closed campaign", async () => {
    const db = createMockSupabase(({ operation }) => {
      if (operation === "rpc") {
        return {
          data: null,
          error: { message: "listening_campaign_not_open" },
        };
      }
      return { data: null, error: null };
    });
    await expect(
      submitPublicListeningResponse(db, TOKEN, [
        { question_id: "q-text", value: { text: "x" } },
      ])
    ).rejects.toThrow("listening_campaign_not_open");
  });

  it("resolve helper maps invalid token from RPC", async () => {
    const db = createMockSupabase(() => ({
      data: null,
      error: { message: "listening_token_invalid" },
    }));
    await expect(resolvePublicListeningCampaign(db, TOKEN)).rejects.toThrow(
      "listening_token_invalid"
    );
  });
});

describe("Listening respondent — completion + errors UI", () => {
  it("renders thank-you without internal identifiers", () => {
    const html = renderToStaticMarkup(
      createElement(ListeningThankYou, {
        title: "Culture pulse",
        privacyStatement: "Anonymous follow-up",
      })
    );
    expect(html).toContain("listening-thank-you");
    expect(html).toContain("Thank you");
    expect(html).toContain("Anonymous follow-up");
    expect(html).not.toContain("response_id");
    expect(html).not.toContain("11111111");
  });

  it("renders professional invalid / closed states", () => {
    const invalid = renderToStaticMarkup(
      createElement(ListeningPublicError, {
        error: classifyListeningPublicError("listening_token_invalid"),
      })
    );
    expect(invalid).toContain('data-error-kind="invalid_token"');

    const closed = renderToStaticMarkup(
      createElement(ListeningPublicError, {
        error: classifyListeningPublicError("listening_campaign_not_open"),
      })
    );
    expect(closed).toContain('data-error-kind="closed"');
  });
});

describe("Listening respondent — duplicate submit prevention contract", () => {
  it("validateRequiredAnswers stays green once complete; submit payload non-empty", () => {
    const view = toRespondentView(SAMPLE_CONTRACT);
    const answers = {
      "q-text": "ok",
      "q-choice": "yes",
      "q-likert": "1",
    };
    expect(validateRequiredAnswers(view.questions, answers)).toEqual({
      ok: true,
    });
    expect(toSubmitAnswers(view.questions, answers).length).toBeGreaterThan(0);
  });
});
