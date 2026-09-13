import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Letting a prospective parent see the campus she applied to — and nothing else.
 *
 * After migration 350 unblocked reads generally, Lana Robinson could see
 * Savannah's enquiry but not the campus name ("School · —") and not the school
 * year, which left Start Application disabled. The rows existed; she could not
 * read them. can_access_school admits a PARENT only through an enrolled child,
 * and a family being asked to apply has a lead, not a student.
 *
 * The dangerous fix is to add a prospective-guardian branch to
 * can_access_school. That function gates 865 policies, so it would hand her
 * every table scoped to that campus — other families' leads, other children's
 * records, finance. These tests exist mostly to stop that from happening later
 * under time pressure.
 */

const migration = readFileSync(
  join(
    __dirname,
    "..",
    "..",
    "..",
    "supabase/migrations/351_prospective_guardian_sees_campus_2026_09_13.sql"
  ),
  "utf8"
);

/** Statements only — the file explains the reasoning at length in comments. */
const sql = migration.replace(/--.*$/gm, "");

describe("the grant stays narrow", () => {
  /** THE ONE THAT MATTERS. */
  it("does not touch can_access_school", () => {
    expect(sql).not.toMatch(/create\s+or\s+replace\s+function\s+public\.can_access_school/i);
    expect(sql).not.toMatch(/alter\s+function\s+public\.can_access_school/i);
    expect(sql).not.toContain("can_access_school");
  });

  it("adds policies to exactly two tables", () => {
    const tables = [...sql.matchAll(/create policy \w+ on public\.(\w+)/g)].map((m) => m[1]);
    expect(new Set(tables)).toEqual(new Set(["schools", "school_years"]));
  });

  it("grants read only — no insert, update or delete anywhere", () => {
    const policies = [...sql.matchAll(/create policy[\s\S]*?using/g)];
    expect(policies.length).toBe(2);
    expect(sql).not.toMatch(/for\s+(all|insert|update|delete)/i);
    expect(sql).not.toContain("with check");
  });

  /**
   * Postgres ORs policies together, so an added policy can only widen, and only
   * by its own predicate. Dropping somebody else's policy is how a "narrow"
   * migration quietly removes a restriction.
   */
  it("drops only the policies it creates", () => {
    const dropped = [...sql.matchAll(/drop policy if exists (\w+) on/g)].map((m) => m[1]);
    const created = [...sql.matchAll(/create policy (\w+) on/g)].map((m) => m[1]);
    expect(dropped.sort()).toEqual(created.sort());
  });

  it("is scoped by the campus, not left open", () => {
    expect(sql).toMatch(/on public\.schools[\s\S]*?using \(public\.is_prospective_guardian_at_school\(id\)\)/);
    expect(sql).toMatch(
      /on public\.school_years[\s\S]*?using \(public\.is_prospective_guardian_at_school\(school_id\)\)/
    );
    expect(sql).not.toMatch(/using \(\s*true\s*\)/i);
  });
});

describe("the helper cannot repeat migration 350's mistake", () => {
  /**
   * A security-invoker function reading tables from inside a policy is exactly
   * what locked every parent out of the product. The helper reads three tables
   * and is called from two policies, so it must be definer.
   */
  it("is SECURITY DEFINER", () => {
    expect(sql).toMatch(
      /create or replace function public\.is_prospective_guardian_at_school[\s\S]*?security definer/i
    );
  });

  it("pins search_path, which a definer function without one cannot safely omit", () => {
    expect(sql).toMatch(
      /create or replace function public\.is_prospective_guardian_at_school[\s\S]*?set search_path = public, pg_temp/i
    );
  });

  /**
   * It answers about the caller and nobody else. A definer function that took a
   * user id would let any signed-in person ask questions about anyone — the
   * reason this one keys on auth.uid() internally rather than by argument.
   */
  it("answers only about auth.uid()", () => {
    const body = sql.slice(
      sql.indexOf("is_prospective_guardian_at_school"),
      sql.indexOf("comment on function")
    );
    expect(body).toContain("u.id = auth.uid()");
    // One argument, and it is the campus — not a person.
    expect(body).toMatch(/is_prospective_guardian_at_school\(p_school_id uuid\)/);
  });

  it("matches a guardian the same way the portal does", () => {
    // is_guardian_of_lead and the portal loader both compare lowercased email.
    // A different comparison here would let the campus and the enquiry disagree.
    expect(sql).toContain("lower(g.email) = lower(u.email)");
    expect(sql).toContain("g.email is not null");
  });
});

describe("it refuses to report success it did not achieve", () => {
  it("checks its own work and raises if anything is missing", () => {
    expect(sql).toContain("raise exception");
    expect(sql).toContain("Migration 351 did not take effect");
  });

  it("verifies the helper's security mode, not just its existence", () => {
    expect(sql).toContain("p.prosecdef");
  });
});
