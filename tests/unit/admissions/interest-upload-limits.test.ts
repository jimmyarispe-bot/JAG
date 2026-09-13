import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  checkFileBeforeUpload,
  describeUploadFailure,
} from "@/lib/admissions/interest-form/upload-limits";

/**
 * Attaching proof of income to the inquiry form.
 *
 * On 13 September 2026 a family attaching the document GA GOAL requires was
 * shown:
 *
 *     Unexpected token 'R', "Request En"... is not valid JSON
 *
 * "Request Entity Too Large", arriving as plain text from the platform, through
 * a client that called .json() on it without looking. Three components each held
 * an opinion about the size limit — the route said 10MB, the caption said 10MB,
 * and Vercel said 4.5MB before either of them ran.
 */

const root = join(__dirname, "..", "..", "..");
const routeSrc = readFileSync(join(root, "src/app/api/apply/upload/route.ts"), "utf8");
const rendererSrc = readFileSync(
  join(root, "src/components/admissions/portal/InterestFormRenderer.tsx"),
  "utf8"
);

/**
 * Comments in these files quote the old code on purpose, so a reader
 * understands what was wrong with it. Asserting the old code is gone therefore
 * has to look at the code, not at the explanation of why it went. This caught
 * itself on the first run.
 */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const rendererCode = code(rendererSrc);
const routeCode = code(routeSrc);

describe("the limit is one number", () => {
  /**
   * THE ONE THAT MATTERS. Vercel caps a serverless request body at 4.5MB and
   * enforces it before the handler runs, so any limit at or above that is a
   * promise the form cannot keep — and it fails in the least legible way
   * possible, because our own error handling never executes.
   */
  it("sits below the platform body cap, with room for multipart overhead", () => {
    expect(MAX_UPLOAD_BYTES).toBeLessThan(4.5 * 1024 * 1024);
    // Still large enough to be worth having.
    expect(MAX_UPLOAD_BYTES).toBeGreaterThanOrEqual(3 * 1024 * 1024);
  });

  it("is read by the route rather than retyped", () => {
    expect(routeCode).toContain("MAX_UPLOAD_BYTES");
    expect(routeCode).toContain("ALLOWED_UPLOAD_TYPES");
    expect(routeCode).not.toMatch(/10\s*\*\s*1024\s*\*\s*1024/);
  });

  it("is read by the caption rather than retyped", () => {
    expect(rendererCode).toContain("{MAX_UPLOAD_LABEL}");
    expect(rendererCode).not.toContain("up to 10MB");
  });

  it("has a label that matches the number", () => {
    expect(MAX_UPLOAD_LABEL).toBe(`${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`);
  });
});

describe("the client never parses a body it has not looked at", () => {
  /**
   * The bug itself. `await response.json()` on a plain-text 413 throws, and the
   * parser's complaint becomes the message a family reads.
   */
  it("reads the response as text before attempting JSON", () => {
    expect(rendererCode).toContain("await response.text()");
    expect(rendererCode).not.toMatch(/await response\.json\(\)/);
  });

  it("falls back to a message chosen by the status code", () => {
    expect(rendererCode).toContain("describeUploadFailure(response.status)");
  });

  it("logs the unparseable body so the next one is diagnosable", () => {
    expect(rendererSrc).toMatch(/\[apply\/upload\] non-JSON response/);
  });
});

describe("what the family is told when it fails", () => {
  it("explains a 413 in terms of the file, not the protocol", () => {
    const msg = describeUploadFailure(413);
    expect(msg).toContain("too large");
    expect(msg).toContain(MAX_UPLOAD_LABEL);
    expect(msg).not.toContain("JSON");
    expect(msg).not.toContain("413");
  });

  it("distinguishes rate limiting from failure", () => {
    expect(describeUploadFailure(429)).toContain("Too many uploads");
  });

  /** A number in the message is the difference between one email and three. */
  it("carries the status on anything unexplained", () => {
    expect(describeUploadFailure(500)).toContain("500");
    expect(describeUploadFailure(418)).toContain("418");
  });
});

describe("refusing before the round trip", () => {
  const pdf = (size: number) => ({ size, type: "application/pdf" });

  it("accepts a normal document", () => {
    expect(checkFileBeforeUpload(pdf(900_000))).toBeNull();
  });

  it("names the actual size, so the family knows how far over they are", () => {
    const msg = checkFileBeforeUpload(pdf(7 * 1024 * 1024));
    expect(msg).toContain("7.0MB");
    expect(msg).toContain(MAX_UPLOAD_LABEL);
  });

  it("catches an empty file, which uploads fine and helps nobody", () => {
    expect(checkFileBeforeUpload(pdf(0))).toContain("empty");
  });

  it("checks the type against the same allowlist the route uses", () => {
    expect(checkFileBeforeUpload({ size: 1000, type: "application/zip" })).toContain(
      "PDF, JPG or PNG"
    );
    for (const type of Object.keys(ALLOWED_UPLOAD_TYPES)) {
      expect(checkFileBeforeUpload({ size: 1000, type })).toBeNull();
    }
  });

  it("takes phone photograph formats, which is what a parent actually has", () => {
    expect(ALLOWED_UPLOAD_TYPES["image/heic"]).toBe("heic");
    expect(ALLOWED_UPLOAD_TYPES["image/jpeg"]).toBe("jpg");
  });
});
