import { afterEach, describe, expect, it } from "vitest";
import {
  getEmailProvider,
  resetEmailProviderCache,
  sendTransactionalEmail,
} from "@/lib/platform/email";

afterEach(() => {
  resetEmailProviderCache();
  delete process.env.RESEND_API_KEY;
});

describe("email provider (C-6.2)", () => {
  it("resolves none provider when RESEND_API_KEY is absent", async () => {
    const provider = getEmailProvider();
    expect(provider.id).toBe("none");
    const result = await sendTransactionalEmail({
      to: "user@example.com",
      subject: "Test",
      body: "Hello",
    });
    expect(result.success).toBe(false);
    expect(result.provider).toBe("none");
  });

  it("resolves resend provider when RESEND_API_KEY is set", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    resetEmailProviderCache();
    expect(getEmailProvider().id).toBe("resend");
  });
});
