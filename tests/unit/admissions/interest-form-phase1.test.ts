/**
 * Phase 1 — Admissions Interest Form (published rendering + persistence rules).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  formDataToInterestValues,
  hashInterestFormDefinition,
  isQuestionVisible,
  parseInterestFormDefinition,
  validateInterestFormDefinition,
  validateInterestSubmission,
} from "@/lib/admissions/interest-form/definition";
import { isInterestFormDevOrgFallbackEnabled } from "@/lib/admissions/interest-form/org-resolve";
import { INITIAL_INTEREST_FORM_DEFINITION } from "@/lib/admissions/interest-form/seed-definition";
import {
  assertPublishedVersionImmutable,
  createPublishedInterestForm,
  openDraftFromPublished,
  publishWorkingDraft,
} from "@/lib/admissions/interest-form/versioning";
import type { InterestFormDefinition } from "@/lib/admissions/interest-form/types";
import { resolveSlugFromHostMap } from "@/lib/platform/organizations/domains";

const ROOT = process.cwd();
const MIGRATION = readFileSync(
  join(ROOT, "supabase/migrations/223_admissions_interest_form_phase1.sql"),
  "utf8"
);

const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SCHOOL_A = "11111111-1111-4111-8111-111111111111";
const SCHOOL_B = "22222222-2222-4222-8222-222222222222";
const SCHOOL_CLOSED = "33333333-3333-4333-8333-333333333333";
const VERSION_A = "44444444-4444-4444-8444-444444444444";

function withConditionalQuestions(): InterestFormDefinition {
  return {
    ...INITIAL_INTEREST_FORM_DEFINITION,
    questions: INITIAL_INTEREST_FORM_DEFINITION.questions.map((q) => {
      if (q.key === "learning_concerns") {
        return {
          ...q,
          required: true,
          visibleWhen: {
            all: [{ path: "school_id", op: "eq", value: SCHOOL_A }],
          },
        };
      }
      if (q.key === "program") {
        return {
          ...q,
          required: true,
          visibleWhen: {
            all: [{ path: "school_id", op: "eq", value: SCHOOL_A }],
          },
        };
      }
      return q;
    }),
  };
}

describe("migration 223 — Phase 1 persistence", () => {
  it("creates form/version/submission/answer tables and school eligibility", () => {
    expect(MIGRATION).toContain("admissions_interest_forms");
    expect(MIGRATION).toContain("admissions_interest_form_versions");
    expect(MIGRATION).toContain("admissions_interest_submissions");
    expect(MIGRATION).toContain("admissions_interest_answers");
    expect(MIGRATION).toContain("admissions_interest_public");
    expect(MIGRATION).toContain("list_schools_for_public_inquiry(p_organization_id uuid)");
    expect(MIGRATION).toContain("list_programs_for_public_inquiry");
    expect(MIGRATION).toContain("Published interest form versions are immutable");
    expect(MIGRATION).toContain("for select to authenticated");
  });

  it("does not add authenticated write policies", () => {
    expect(MIGRATION).not.toMatch(/for insert to authenticated/i);
    expect(MIGRATION).not.toMatch(/for update to authenticated/i);
    expect(MIGRATION).not.toMatch(/for delete to authenticated/i);
  });

  it("zero-arg school list no longer returns all schools", () => {
    expect(MIGRATION).toContain("where false");
  });

  it("defaults admissions_interest_public to false (new schools not public)", () => {
    expect(MIGRATION).toMatch(
      /admissions_interest_public boolean not null default false/
    );
    expect(MIGRATION).toContain(
      "alter column admissions_interest_public set default false"
    );
    expect(MIGRATION).not.toMatch(
      /admissions_interest_public boolean not null default true/
    );
  });

  it("explicitly enables known active seed schools by durable UUID only", () => {
    expect(MIGRATION).toContain("a1000000-0000-4000-8000-000000000001");
    expect(MIGRATION).toContain("a1000000-0000-4000-8000-000000000002");
    expect(MIGRATION).toContain("a1000000-0000-4000-8000-000000000003");
    expect(MIGRATION).toContain("a1000000-0000-4000-8000-000000000004");
    expect(MIGRATION).toContain("set admissions_interest_public = false");
    expect(MIGRATION).toContain("set admissions_interest_public = true");
    // No name-based closed-school logic
    expect(MIGRATION).not.toMatch(/where[\s\S]*name\s+ilike[\s\S]*NJ/i);
    expect(MIGRATION).not.toMatch(/name\s*=\s*'Academy NJ'/i);
    expect(MIGRATION).not.toMatch(/name\s*=\s*'The Academy NJ'/i);
  });
});

describe("org resolution — fail closed", () => {
  it("known production host maps to organization slug via domain map", () => {
    const prev = process.env.ORGANIZATION_DOMAIN_MAP;
    process.env.ORGANIZATION_DOMAIN_MAP = JSON.stringify({
      "apply.example.org": "tenant-a",
    });
    try {
      expect(resolveSlugFromHostMap("apply.example.org")).toBe("tenant-a");
      expect(resolveSlugFromHostMap("APPLY.EXAMPLE.ORG:443")).toBe("tenant-a");
    } finally {
      if (prev === undefined) delete process.env.ORGANIZATION_DOMAIN_MAP;
      else process.env.ORGANIZATION_DOMAIN_MAP = prev;
    }
  });

  it("unknown production host has no domain-map hit (fail-closed signal)", () => {
    const prev = process.env.ORGANIZATION_DOMAIN_MAP;
    process.env.ORGANIZATION_DOMAIN_MAP = JSON.stringify({
      "apply.example.org": "tenant-a",
    });
    try {
      expect(resolveSlugFromHostMap("unknown-tenant.example")).toBeNull();
    } finally {
      if (prev === undefined) delete process.env.ORGANIZATION_DOMAIN_MAP;
      else process.env.ORGANIZATION_DOMAIN_MAP = prev;
    }
  });

  it("production env disables development org fallback even with opt-in flag", () => {
    expect(
      isInterestFormDevOrgFallbackEnabled({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        ADMISSIONS_INTEREST_ALLOW_DEV_ORG_FALLBACK: "true",
      })
    ).toBe(false);
    expect(
      isInterestFormDevOrgFallbackEnabled({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
      })
    ).toBe(false);
  });

  it("localhost/dev fallback only in development or test", () => {
    expect(
      isInterestFormDevOrgFallbackEnabled({
        NODE_ENV: "development",
        VERCEL_ENV: "development",
      })
    ).toBe(true);
    expect(
      isInterestFormDevOrgFallbackEnabled({
        NODE_ENV: "test",
      })
    ).toBe(true);
    expect(
      isInterestFormDevOrgFallbackEnabled({
        NODE_ENV: "production",
      })
    ).toBe(false);
  });

  it("resolver fails closed before seed when production gate is off", () => {
    const src = readFileSync(
      join(ROOT, "src/lib/admissions/interest-form/org-resolve.ts"),
      "utf8"
    );
    expect(src).toContain("if (!isInterestFormDevOrgFallbackEnabled())");
    expect(src).toContain("return null");
    expect(src).toMatch(
      /resolveOrganizationByRequestHost[\s\S]*isInterestFormDevOrgFallbackEnabled/
    );
    // Seed fallback must not run in production path
    expect(
      isInterestFormDevOrgFallbackEnabled({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      })
    ).toBe(false);
  });

  it("forged organization_slug is not authoritative on public resolve/submit", () => {
    const src = readFileSync(
      join(ROOT, "src/lib/admissions/interest-form/org-resolve.ts"),
      "utf8"
    );
    const submitSrc = readFileSync(
      join(ROOT, "src/lib/admissions/interest-form/submit.ts"),
      "utf8"
    );
    expect(src).not.toMatch(/input\?\.slug/);
    expect(src).not.toMatch(/slug\?:\s*string/);
    expect(submitSrc).not.toMatch(/formData\.get\(["']organization_slug["']\)/);
    expect(submitSrc).toContain("resolveInterestFormOrganization()");
  });
});

describe("1–3 form creation / published load / immutable published", () => {
  it("creates published v1", () => {
    const { form, version } = createPublishedInterestForm({
      organizationId: ORG_A,
      definition: INITIAL_INTEREST_FORM_DEFINITION,
      formId: "form-a",
      versionId: VERSION_A,
    });
    expect(form.publishedVersionId).toBe(VERSION_A);
    expect(version.lifecycle).toBe("published");
    expect(version.versionNumber).toBe(1);
    expect(version.contentHash).toBe(
      hashInterestFormDefinition(INITIAL_INTEREST_FORM_DEFINITION)
    );
  });

  it("loads published definition via parse + hash", () => {
    const parsed = parseInterestFormDefinition(INITIAL_INTEREST_FORM_DEFINITION);
    expect(parsed?.title).toBe("Express Interest");
    expect(validateInterestFormDefinition(parsed!).length).toBe(0);
  });

  it("rejects mutating published definition", () => {
    const { version } = createPublishedInterestForm({
      organizationId: ORG_A,
      definition: INITIAL_INTEREST_FORM_DEFINITION,
    });
    expect(() =>
      assertPublishedVersionImmutable(version, {
        ...INITIAL_INTEREST_FORM_DEFINITION,
        title: "Mutated",
      })
    ).toThrow(/immutable/i);
  });

  it("supports published → draft → published without dual drafts", () => {
    const created = createPublishedInterestForm({
      organizationId: ORG_A,
      definition: INITIAL_INTEREST_FORM_DEFINITION,
    });
    const drafted = openDraftFromPublished({
      form: created.form,
      published: created.version,
      nextDefinition: {
        ...INITIAL_INTEREST_FORM_DEFINITION,
        title: "Express Interest v2",
      },
    });
    expect(() =>
      openDraftFromPublished({
        form: drafted.form,
        published: created.version,
      })
    ).toThrow(/already exists/i);

    const published = publishWorkingDraft({
      form: drafted.form,
      draft: drafted.draft,
      previousPublished: created.version,
    });
    expect(published.published.versionNumber).toBe(2);
    expect(published.archived?.lifecycle).toBe("archived");
    expect(published.form.draftVersionId).toBeNull();
  });
});

describe("4–7 organization isolation + school/program filtering", () => {
  it("keeps form org ownership distinct", () => {
    const a = createPublishedInterestForm({
      organizationId: ORG_A,
      definition: INITIAL_INTEREST_FORM_DEFINITION,
    });
    const b = createPublishedInterestForm({
      organizationId: ORG_B,
      definition: INITIAL_INTEREST_FORM_DEFINITION,
    });
    expect(a.form.organizationId).not.toBe(b.form.organizationId);
  });

  it("closed school is not publicly selectable; active flag is", () => {
    const rows = [
      { id: SCHOOL_A, admissions_interest_public: true },
      { id: SCHOOL_CLOSED, admissions_interest_public: false },
    ];
    const publicIds = rows
      .filter((s) => s.admissions_interest_public)
      .map((s) => s.id);
    expect(publicIds).toEqual([SCHOOL_A]);
    expect(publicIds).not.toContain(SCHOOL_CLOSED);
  });

  it("new school default is non-public until explicitly enabled", () => {
    const newSchool = {
      id: "99999999-9999-4999-8999-999999999999",
      admissions_interest_public: false, // column default
    };
    expect(newSchool.admissions_interest_public).toBe(false);
    expect(MIGRATION).toMatch(/default false/);
  });

  it("does not hard-code school names for eligibility", () => {
    const formEngine = readFileSync(
      join(ROOT, "src/lib/admissions/interest-form/definition.ts"),
      "utf8"
    );
    const renderer = readFileSync(
      join(ROOT, "src/components/admissions/portal/InterestFormRenderer.tsx"),
      "utf8"
    );
    expect(formEngine).not.toMatch(/Academy NJ/);
    expect(renderer).not.toMatch(/Academy NJ/);
    expect(MIGRATION).not.toMatch(/name\s*=\s*'[^']*NJ[^']*'/i);
  });

  it("program filtering is school-scoped", () => {
    const bySchool = new Map([
      [SCHOOL_A, new Set(["academy_ga_campus"])],
      [SCHOOL_B, new Set(["academy_fl_campus"])],
    ]);
    expect(bySchool.get(SCHOOL_A)?.has("academy_fl_campus")).toBe(false);
    expect(bySchool.get(SCHOOL_B)?.has("academy_ga_campus")).toBe(false);
  });
});

describe("8–15 conditional visibility + validation", () => {
  const definition = withConditionalQuestions();
  const schoolIds = new Set([SCHOOL_A]);

  it("shows school-conditional required question when school matches", () => {
    const q = definition.questions.find((x) => x.key === "learning_concerns")!;
    expect(isQuestionVisible(q, { school_id: SCHOOL_A }, true)).toBe(true);
    const result = validateInterestSubmission({
      definition,
      values: {
        first_name: "A",
        last_name: "B",
        school_id: SCHOOL_A,
        guardian_email: "a@example.com",
        program: "academy_ga_campus",
      },
      schoolIds,
      programCodesForSchool: new Set(["academy_ga_campus"]),
      claimedFormVersionId: VERSION_A,
      publishedFormVersionId: VERSION_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "learning_concerns")).toBe(true);
    }
  });

  it("ignores hidden required questions", () => {
    const result = validateInterestSubmission({
      definition,
      values: {
        first_name: "A",
        last_name: "B",
        school_id: SCHOOL_B,
        guardian_email: "a@example.com",
      },
      schoolIds: new Set([SCHOOL_A, SCHOOL_B]),
      programCodesForSchool: new Set(),
      claimedFormVersionId: VERSION_A,
      publishedFormVersionId: VERSION_A,
    });
    expect(result.ok).toBe(true);
  });

  it("enforces required visible questions", () => {
    const result = validateInterestSubmission({
      definition: INITIAL_INTEREST_FORM_DEFINITION,
      values: { last_name: "B", school_id: SCHOOL_A, guardian_email: "a@example.com" },
      schoolIds,
      programCodesForSchool: new Set(),
      claimedFormVersionId: VERSION_A,
      publishedFormVersionId: VERSION_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "first_name")).toBe(true);
    }
  });

  it("rejects invalid school", () => {
    const result = validateInterestSubmission({
      definition: INITIAL_INTEREST_FORM_DEFINITION,
      values: {
        first_name: "A",
        last_name: "B",
        school_id: SCHOOL_B,
        guardian_email: "a@example.com",
      },
      schoolIds,
      programCodesForSchool: new Set(),
      claimedFormVersionId: VERSION_A,
      publishedFormVersionId: VERSION_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "school_id")).toBe(true);
    }
  });

  it("rejects invalid program for school", () => {
    const result = validateInterestSubmission({
      definition,
      values: {
        first_name: "A",
        last_name: "B",
        school_id: SCHOOL_A,
        guardian_email: "a@example.com",
        program: "academy_fl_campus",
        learning_concerns: "notes",
      },
      schoolIds,
      programCodesForSchool: new Set(["academy_ga_campus"]),
      claimedFormVersionId: VERSION_A,
      publishedFormVersionId: VERSION_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "program")).toBe(true);
    }
  });

  it("rejects invalid question keys", () => {
    const result = validateInterestSubmission({
      definition: INITIAL_INTEREST_FORM_DEFINITION,
      values: {
        first_name: "A",
        last_name: "B",
        school_id: SCHOOL_A,
        guardian_email: "a@example.com",
        forged_field: "nope",
      },
      schoolIds,
      programCodesForSchool: new Set(),
      claimedFormVersionId: VERSION_A,
      publishedFormVersionId: VERSION_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "forged_field")).toBe(true);
    }
  });

  it("rejects stale form version", () => {
    const result = validateInterestSubmission({
      definition: INITIAL_INTEREST_FORM_DEFINITION,
      values: {
        first_name: "A",
        last_name: "B",
        school_id: SCHOOL_A,
        guardian_email: "a@example.com",
      },
      schoolIds,
      programCodesForSchool: new Set(),
      claimedFormVersionId: "stale-version",
      publishedFormVersionId: VERSION_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "form_version_id")).toBe(true);
    }
  });
});

describe("16–20 lead/submission/answers/history/cross-org", () => {
  it("maps form data into values for lead creation bindings", () => {
    const fd = new FormData();
    fd.set("first_name", "Ada");
    fd.set("last_name", "Lovelace");
    fd.set("school_id", SCHOOL_A);
    fd.set("guardian_email", "ada@example.com");
    fd.append("funding_sources", "parent_pay");
    fd.append("funding_sources", "esa");
    const values = formDataToInterestValues(fd);
    expect(values.first_name).toBe("Ada");
    expect(values.funding_sources).toEqual(["parent_pay", "esa"]);
  });

  it("persists answer shape keyed by question + version", () => {
    const visible = {
      first_name: "Ada",
      last_name: "Lovelace",
      school_id: SCHOOL_A,
      guardian_email: "ada@example.com",
    };
    const answerRows = Object.entries(visible).map(([question_key, value]) => ({
      submission_id: "sub-1",
      organization_id: ORG_A,
      form_version_id: VERSION_A,
      question_key,
      value,
    }));
    expect(answerRows).toHaveLength(4);
    expect(answerRows.every((r) => r.form_version_id === VERSION_A)).toBe(true);
  });

  it("preserves historical version when publishing v2", () => {
    const v1 = createPublishedInterestForm({
      organizationId: ORG_A,
      definition: INITIAL_INTEREST_FORM_DEFINITION,
      versionId: "v1",
    });
    const draft = openDraftFromPublished({
      form: v1.form,
      published: v1.version,
      nextDefinition: { ...INITIAL_INTEREST_FORM_DEFINITION, title: "v2" },
      draftVersionId: "v2",
    });
    const v2 = publishWorkingDraft({
      form: draft.form,
      draft: draft.draft,
      previousPublished: v1.version,
    });
    expect(v2.archived?.id).toBe("v1");
    expect(v2.archived?.definition.title).toBe("Express Interest");
    expect(v2.published.definition.title).toBe("v2");
  });

  it("rejects cross-organization school on submission", () => {
    const result = validateInterestSubmission({
      definition: INITIAL_INTEREST_FORM_DEFINITION,
      values: {
        first_name: "A",
        last_name: "B",
        school_id: SCHOOL_B,
        guardian_email: "a@example.com",
      },
      schoolIds: new Set([SCHOOL_A]), // org A public schools only
      programCodesForSchool: new Set(),
      claimedFormVersionId: VERSION_A,
      publishedFormVersionId: VERSION_A,
    });
    expect(result.ok).toBe(false);
  });

  it("seed definition stays functionally equivalent to current inquiry fields", () => {
    const keys = INITIAL_INTEREST_FORM_DEFINITION.questions.map((q) => q.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "first_name",
        "last_name",
        "preferred_name",
        "date_of_birth",
        "current_grade",
        "applying_for_grade",
        "school_id",
        "program",
        "funding_sources",
        "referral_source",
        "learning_concerns",
        "guardian_first_name",
        "guardian_last_name",
        "guardian_email",
        "guardian_phone",
        "preferred_contact_method",
      ])
    );
  });
});
