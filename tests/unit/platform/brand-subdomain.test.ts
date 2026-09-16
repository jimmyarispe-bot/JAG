import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BrandRegistry } from "@/lib/platform/branding/BrandRegistry";
import { resolveFromHost } from "@/lib/platform/branding/BrandResolver";

/**
 * WHICH ADDRESS OPENS THE ACADEMY WAY'S FRONT DOOR.
 *
 * 16 September 2026. The question was why school leaders are sent to
 * academy.thejag.org rather than theacademyway.thejag.org. The answer was a
 * string typed in two places years apart: BrandRegistry's seed, and migration
 * 226's insert into organization_brands.
 *
 * Changing only the database moved nothing. resolveFromHost reads the in-memory
 * registry and never queries Postgres, so the site kept serving the old host
 * while wrong-door.ts - the one thing that DOES read the column - started
 * telling locked-out people to use an address the site would not serve. Two
 * halves of one setting, disagreeing, with the half that talks to a stranded
 * human pointing at the wrong place. Reverted within minutes.
 *
 * So this file asserts the two agree. Not that either equals a constant written
 * here - that would just be a third place to forget - but that the registry and
 * the migration say the SAME thing, read from the migration on every run.
 */

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

/**
 * The subdomain the database is seeded with, read out of the migrations.
 *
 * Last write wins: migrations replay in filename order, so the final insert for
 * org.the-academy-way is the one in force. Comments are stripped first because
 * prose in them carries quotes and parentheses.
 */
function subdomainFromMigrations(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  let found: string | null = null;

  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8").replace(/--[^\n]*/g, "");
    // ... values ( 'org.the-academy-way', '<subdomain>', ...
    const re = /'org\.the-academy-way'\s*,\s*'([a-z0-9-]+)'/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql))) found = m[1];

    // ... and any later UPDATE that sets it.
    const upd = /update\s+public\.organization_brands[\s\S]{0,200}?set\s+subdomain\s*=\s*'([a-z0-9-]+)'/gi;
    while ((m = upd.exec(sql))) found = m[1];
  }

  if (!found) throw new Error("no subdomain for org.the-academy-way found in migrations");
  return found;
}

describe("the registry and the database agree on the front door", () => {
  const fromDb = subdomainFromMigrations();

  it("found a real value to compare against", () => {
    expect(fromDb).toMatch(/^[a-z0-9-]+$/);
  });

  /** THE ONE THAT MATTERS. */
  it("serves the same subdomain the migrations seed", () => {
    const brand = BrandRegistry.getBySubdomain(fromDb);
    expect(
      brand?.organization_id,
      `migrations seed '${fromDb}' but the registry does not serve that subdomain - ` +
        `the site and wrong-door.ts would disagree about the address`
    ).toBe("org.the-academy-way");
  });

  it("resolves the host that subdomain implies", () => {
    expect(resolveFromHost(`https://${fromDb}.thejag.org`).organization_id).toBe(
      "org.the-academy-way"
    );
  });
});

describe("both doors open", () => {
  /**
   * The new address. This is what the wrong-door screen and every instruction
   * given to staff should name.
   */
  it("theacademyway.thejag.org is The Academy Way", () => {
    expect(resolveFromHost("https://theacademyway.thejag.org").organization_id).toBe(
      "org.the-academy-way"
    );
  });

  /**
   * The old address, kept as an alias. Heather Badger-Brown was told to use
   * academy.thejag.org all week; it is in her bookmarks and in JAG's own
   * error message. If this ever goes red, somebody's front door has been
   * removed from under them.
   */
  it("academy.thejag.org still is too", () => {
    expect(resolveFromHost("https://academy.thejag.org").organization_id).toBe(
      "org.the-academy-way"
    );
  });

  it("gives both hosts the same brand object, not two copies", () => {
    expect(resolveFromHost("https://academy.thejag.org")).toBe(
      resolveFromHost("https://theacademyway.thejag.org")
    );
  });

  /** Proves the resolver can miss, rather than returning The Academy Way for anything. */
  it("does not hand The Academy Way to an unrelated subdomain", () => {
    expect(resolveFromHost("https://nobody.thejag.org").organization_id).not.toBe(
      "org.the-academy-way"
    );
  });

  it("leaves the other tenants alone", () => {
    expect(resolveFromHost("https://acme.thejag.org").organization_id).toBe("org-acme");
    expect(resolveFromHost("https://signalcenters.thejag.org").organization_id).toBe(
      "org-signalcenters"
    );
  });
});
