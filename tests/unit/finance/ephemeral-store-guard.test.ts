import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertEphemeralStoreAllowed } from "../../../packages/platform/finance/runtime-guard";

const ORIGINAL = { ...process.env };

function setEnv(env: Record<string, string | undefined>) {
  delete process.env.VERCEL_ENV;
  delete process.env.JAG_ALLOW_EPHEMERAL_FINANCE;
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

beforeEach(() => setEnv({ NODE_ENV: "test" }));
afterEach(() => {
  for (const k of Object.keys(process.env)) delete process.env[k];
  Object.assign(process.env, ORIGINAL);
});

describe("ephemeral finance store guard", () => {
  it("allows test and development", () => {
    setEnv({ NODE_ENV: "test" });
    expect(() => assertEphemeralStoreAllowed("banking")).not.toThrow();
    setEnv({ NODE_ENV: "development" });
    expect(() => assertEphemeralStoreAllowed("banking")).not.toThrow();
  });

  it("blocks Vercel production", () => {
    setEnv({ NODE_ENV: "production", VERCEL_ENV: "production" });
    expect(() => assertEphemeralStoreAllowed("payables")).toThrow(/in-memory only/);
  });

  it("blocks Vercel preview — preview writes real staging data", () => {
    setEnv({ NODE_ENV: "production", VERCEL_ENV: "preview" });
    expect(() => assertEphemeralStoreAllowed("planning")).toThrow(/in-memory only/);
  });

  it("blocks bare NODE_ENV=production with no VERCEL_ENV", () => {
    setEnv({ NODE_ENV: "production" });
    expect(() => assertEphemeralStoreAllowed("revenue")).toThrow();
  });

  it("names the store in the error so the caller is identifiable", () => {
    setEnv({ NODE_ENV: "production", VERCEL_ENV: "production" });
    expect(() => assertEphemeralStoreAllowed("reconciliation")).toThrow(/"reconciliation"/);
  });

  it("points at the README", () => {
    setEnv({ NODE_ENV: "production", VERCEL_ENV: "production" });
    expect(() => assertEphemeralStoreAllowed("banking")).toThrow(
      /packages\/platform\/finance\/README\.md/
    );
  });

  it("honours the explicit override", () => {
    setEnv({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      JAG_ALLOW_EPHEMERAL_FINANCE: "1",
    });
    expect(() => assertEphemeralStoreAllowed("banking")).not.toThrow();
  });

  it("ignores a non-'1' override value", () => {
    setEnv({ NODE_ENV: "production", VERCEL_ENV: "production", JAG_ALLOW_EPHEMERAL_FINANCE: "true" });
    expect(() => assertEphemeralStoreAllowed("banking")).toThrow();
  });
});
