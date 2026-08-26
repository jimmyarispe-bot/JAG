import { describe, expect, it } from "vitest";
import {
  parseSupabaseRef,
  shouldShowBanner,
  type EnvironmentIdentity,
} from "@/lib/platform/environment/identity";

function identity(over: Partial<EnvironmentIdentity> = {}): EnvironmentIdentity {
  return {
    deployment: "production",
    databaseRef: "ybcpaffklggaloxhnqkl",
    databaseName: "PRODUCTION",
    databaseIsProduction: true,
    commit: "f65fbef",
    mismatch: false,
    unidentified: false,
    ...over,
  };
}

describe("parseSupabaseRef", () => {
  it("extracts the project ref from a Supabase URL", () => {
    expect(parseSupabaseRef("https://ybcpaffklggaloxhnqkl.supabase.co")).toBe(
      "ybcpaffklggaloxhnqkl"
    );
    expect(parseSupabaseRef("https://nkyuuzzunymshoocykwr.supabase.co/")).toBe(
      "nkyuuzzunymshoocykwr"
    );
  });

  it("returns null rather than guessing", () => {
    expect(parseSupabaseRef(undefined)).toBeNull();
    expect(parseSupabaseRef("")).toBeNull();
    expect(parseSupabaseRef("not-a-url")).toBeNull();
  });
});

describe("shouldShowBanner", () => {
  it("stays out of the way on a correctly-configured production deployment", () => {
    // Staff should not see infrastructure chrome while doing their jobs.
    expect(shouldShowBanner(identity())).toBe(false);
  });

  it("marks preview builds", () => {
    expect(
      shouldShowBanner(
        identity({ deployment: "preview", databaseName: "STAGING", databaseIsProduction: false })
      )
    ).toBe(true);
  });

  it("shouts when a preview build is wired to the production database", () => {
    // The dangerous direction: real records reachable from a throwaway build.
    expect(shouldShowBanner(identity({ deployment: "preview", mismatch: true }))).toBe(true);
  });

  it("shouts when production is wired to a non-production database", () => {
    // The 25 Aug failure: work done in earnest, landing nowhere real.
    expect(
      shouldShowBanner(
        identity({
          deployment: "production",
          databaseName: "STAGING",
          databaseIsProduction: false,
          mismatch: true,
        })
      )
    ).toBe(true);
  });

  it("shouts when the database has not been named", () => {
    // An unnamed database must not pass silently as production.
    expect(
      shouldShowBanner(identity({ databaseName: "UNIDENTIFIED", unidentified: true }))
    ).toBe(true);
  });

  it("shouts when the database is unreachable", () => {
    expect(
      shouldShowBanner(identity({ databaseName: null, unidentified: true }))
    ).toBe(true);
  });
});
