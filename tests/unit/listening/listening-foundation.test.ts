/**
 * Slice 1 — Listening Intelligence foundation (schema + tokens + contracts).
 * Static migration security review + pure unit tests (no Production DB).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  hashListeningToken,
  hashListeningTokenHex,
  isListeningTokenShapeValid,
  mintListeningCampaignToken,
} from "@/lib/platform/listening/tokens";
import {
  LISTENING_DEFAULT_MIN_COHORT,
  LISTENING_PRIVACY_MODES,
  LISTENING_V1_QUESTION_TYPES,
} from "@/lib/platform/listening/types";
import { PERMISSION_KEYS } from "@/lib/platform/identity/types";
import {
  PERMISSION_GROUP_DEFINITIONS,
  permissionGroupsForRole,
} from "@/lib/platform/identity/permission-groups";

const ROOT = process.cwd();
const MIGRATION = join(
  ROOT,
  "supabase/migrations/214_listening_intelligence.sql"
);

function sql(): string {
  return readFileSync(MIGRATION, "utf8");
}

describe("Listening foundation migration 214", () => {
  it("exists and does not touch historical migrations", () => {
    const body = sql();
    expect(body.length).toBeGreaterThan(1000);
    expect(body).toContain("214 — JAG Listening Intelligence");
    expect(body).not.toMatch(/drop table if exists public\.(users|roles|org_organizations)/i);
  });

  it("creates required listening tables", () => {
    const body = sql();
    for (const table of [
      "listening_initiatives",
      "listening_instruments",
      "listening_instrument_versions",
      "listening_questions",
      "listening_question_options",
      "listening_segments",
      "listening_campaigns",
      "listening_campaign_segments",
      "listening_response_sessions",
      "listening_responses",
      "listening_answers",
      "listening_analysis_runs",
      "listening_signals",
      "listening_evidence_links",
    ]) {
      expect(body).toContain(`create table if not exists public.${table}`);
    }
  });

  it("enables RLS on all listening tables", () => {
    const body = sql();
    for (const table of [
      "listening_initiatives",
      "listening_campaigns",
      "listening_responses",
      "listening_answers",
      "listening_response_sessions",
    ]) {
      expect(body).toContain(
        `alter table public.${table} enable row level security`
      );
    }
  });

  it("uses Foundation II org access and does not weaken steward helpers", () => {
    const body = sql();
    expect(body).toContain("can_access_organization");
    expect(body).toContain("is_platform_steward");
    expect(body).not.toContain(
      "create or replace function public.is_platform_steward"
    );
    expect(body).not.toContain(
      "create or replace function public.user_can_access_organization"
    );
    expect(body).not.toContain(
      "create or replace function public.is_enterprise_admin("
    );
  });

  it("adds LISTENING_* permissions and org-scoped grants", () => {
    const body = sql();
    for (const key of [
      "LISTENING_VIEW",
      "LISTENING_MANAGE",
      "LISTENING_ANALYZE",
      "LISTENING_RAW",
    ]) {
      expect(body).toContain(`'${key}'`);
    }
    expect(body).toContain("JAG_ORG_ADMIN");
    expect(body).toContain("PLATFORM_OWNER");
    expect(body).toContain("FOUNDER");
  });

  it("protects raw responses with LISTENING_RAW", () => {
    const body = sql();
    expect(body).toContain("listening_responses_raw");
    expect(body).toContain("listening_answers_raw");
    expect(body).toMatch(
      /listening_responses_raw[\s\S]*LISTENING_RAW/
    );
    expect(body).toMatch(
      /listening_answers_raw[\s\S]*LISTENING_RAW/
    );
  });

  it("stores token hash not plaintext and exposes public RPCs", () => {
    const body = sql();
    expect(body).toContain("public_token_hash");
    expect(body).toContain("listening_token_digest");
    expect(body).toContain("resolve_public_listening_campaign");
    expect(body).toContain("submit_listening_response");
    expect(body).toContain("grant execute on function public.resolve_public_listening_campaign");
    expect(body).toContain("grant execute on function public.submit_listening_response");
    expect(body).toContain("revoke all on table public.listening_responses from anon");
    expect(body).toContain("revoke all on table public.listening_answers from anon");
    expect(body).toContain("revoke all on table public.listening_campaigns from anon");
  });

  it("rejects client-controlled organization ownership in submit RPC", () => {
    const body = sql();
    // organization_id taken from campaign row only
    expect(body).toMatch(
      /insert into public\.listening_responses\s*\([\s\S]*v_campaign\.organization_id/
    );
    expect(body).toContain("listening_foreign_question");
    expect(body).toContain("listening_foreign_option");
  });

  it("enforces published instrument immutability triggers", () => {
    const body = sql();
    expect(body).toContain("listening_instrument_version_is_locked");
    expect(body).toContain("trg_listening_questions_immutable");
    expect(body).toContain("listening_version_cannot_unpublish");
  });

  it("uses composite org FKs for cross-org integrity", () => {
    const body = sql();
    expect(body).toContain("listening_campaigns_initiative_org_fk");
    expect(body).toContain("listening_campaigns_version_org_fk");
    expect(body).toContain("listening_responses_campaign_org_fk");
  });

  it("does not hard-code education-only segment enums", () => {
    const body = sql();
    expect(body).not.toMatch(/check\s*\(\s*segment_key\s+in\s*\(\s*'teacher'/i);
    expect(body).not.toContain("Marco Island");
    expect(body).not.toContain("MICMS");
  });

  it("defaults min cohort size for future analytics", () => {
    const body = sql();
    expect(body).toContain("min_cohort_size integer not null default 5");
    expect(LISTENING_DEFAULT_MIN_COHORT).toBe(5);
  });

  it("does not grant anon SELECT on listening tables", () => {
    const body = sql();
    expect(body).not.toMatch(
      /grant\s+select\s+on\s+table\s+public\.listening_\w+\s+to\s+anon/i
    );
    expect(body).not.toMatch(
      /grant\s+all\s+on\s+table\s+public\.listening_\w+\s+to\s+anon/i
    );
  });

  it("privacy modes are modeled", () => {
    const body = sql();
    expect(body).toContain("'anonymous'");
    expect(body).toContain("'confidential'");
    expect(body).toContain("'identified'");
    expect([...LISTENING_PRIVACY_MODES]).toEqual([
      "anonymous",
      "confidential",
      "identified",
    ]);
  });
});

describe("Listening token helpers", () => {
  it("mints strong tokens and hashes consistently", () => {
    const a = mintListeningCampaignToken();
    const b = mintListeningCampaignToken();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(isListeningTokenShapeValid(a)).toBe(true);
    expect(isListeningTokenShapeValid("short")).toBe(false);
    expect(isListeningTokenShapeValid(null)).toBe(false);

    const h1 = hashListeningToken(a);
    const h2 = hashListeningToken(`  ${a}  `);
    expect(h1.equals(h2)).toBe(true);
    expect(hashListeningTokenHex(a).startsWith("\\x")).toBe(true);
  });

  it("rejects malformed tokens for hashing", () => {
    expect(() => hashListeningToken("tiny")).toThrow("listening_token_invalid");
  });
});

describe("Listening permission wiring (app catalog)", () => {
  it("registers LISTENING_* permission keys", () => {
    for (const key of [
      "LISTENING_VIEW",
      "LISTENING_MANAGE",
      "LISTENING_ANALYZE",
      "LISTENING_RAW",
    ] as const) {
      expect(PERMISSION_KEYS).toContain(key);
    }
  });

  it("JAG_ORG_ADMIN receives listening via JAG_ORG_ACCESS group", () => {
    const groups = permissionGroupsForRole("JAG_ORG_ADMIN");
    expect(groups).toContain("JAG_ORG_ACCESS");
    const perms = PERMISSION_GROUP_DEFINITIONS.JAG_ORG_ACCESS.permissions;
    expect(perms).toContain("LISTENING_VIEW");
    expect(perms).toContain("LISTENING_MANAGE");
    expect(perms).toContain("LISTENING_ANALYZE");
    expect(perms).toContain("LISTENING_RAW");
  });

  it("does not grant JAG_ACCESS to JAG_ORG_ADMIN", () => {
    const groups = permissionGroupsForRole("JAG_ORG_ADMIN");
    expect(groups).not.toContain("JAG_ACCESS");
    expect(groups).not.toContain("JAG_PLATFORM_ADMIN");
  });
});

describe("Listening V1 question types", () => {
  it("keeps V1 subset without requiring ranking/matrix", () => {
    expect(LISTENING_V1_QUESTION_TYPES).toEqual([
      "single_choice",
      "likert",
      "long_text",
      "yes_no",
    ]);
  });
});

describe("Listening repository contract (no client org authz)", () => {
  it("public resolve/submit helpers refuse invalid tokens before RPC", async () => {
    const { resolvePublicListeningCampaign, submitPublicListeningResponse } =
      await import("@/lib/platform/listening/repository");
    const fakeDb = {
      rpc: async () => ({ data: null, error: null }),
    } as never;

    await expect(
      resolvePublicListeningCampaign(fakeDb, "short")
    ).rejects.toThrow("listening_token_invalid");
    await expect(
      submitPublicListeningResponse(fakeDb, "x", [])
    ).rejects.toThrow("listening_token_invalid");
  });

  it("create helpers require organizationId", async () => {
    const { createListeningInitiative } = await import(
      "@/lib/platform/listening/repository"
    );
    const fakeDb = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as never;
    await expect(
      createListeningInitiative(fakeDb, { organizationId: "  ", title: "x" })
    ).rejects.toThrow("listening_organization_required");
  });
});
