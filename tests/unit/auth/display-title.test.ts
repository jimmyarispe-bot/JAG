import { describe, expect, it } from "vitest";
import {
  DANNI_TREU_DISPLAY_TITLE,
  resolvePersonalDisplayTitle,
} from "@/lib/auth/display-title";

describe("resolvePersonalDisplayTitle", () => {
  it("returns Chief Schools Officer for Danni Treu emails", () => {
    expect(DANNI_TREU_DISPLAY_TITLE).toBe("Chief Schools Officer");
    expect(resolvePersonalDisplayTitle("danni@theacademyway.org")).toBe(
      "Chief Schools Officer"
    );
    expect(resolvePersonalDisplayTitle("Danni@AcademyOS.org")).toBe(
      "Chief Schools Officer"
    );
  });

  it("falls back to metadata title for other users", () => {
    expect(
      resolvePersonalDisplayTitle("jimmy@theacademyway.org", "Founder & CEO")
    ).toBe("Founder & CEO");
  });

  it("does not treat Executive Director of Schools as Danni's personal title", () => {
    expect(resolvePersonalDisplayTitle("danni@theacademyway.org")).not.toBe(
      "Executive Director of Schools"
    );
  });
});
