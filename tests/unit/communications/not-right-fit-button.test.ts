import { describe, it, expect } from "vitest";
import { renderLetterHtml } from "@/lib/admissions/communications/letter-html";
import { branchForLink, isLinkAnswer, wordingFor } from "@/lib/admissions/gates/answer-by-link";

/**
 * THE GA AND FL SHADOW DAYS LETTER, 19 October 2026 (migration 581).
 *
 * Jimmy approved the buttons in this order: See entire application, Yes —
 * schedule shadow days, No — not the right fit, then the forward line, then
 * Skip next stage. "No" is one click, like Yes.
 */

const SHADOW_DAYS =
  "{{student_full_name}} is waiting for you to send {{student_first_name}}'s Shadow Day invitation.\r\n" +
  "Click the Yes button below to send the email to {{student_first_name}}'s parent to schedule {{student_first_name}}'s Shadow Days.\r\n" +
  "{{application_view_link}}\r\n\r\n{{invite_shadow_days_link}}\r\n\r\n{{not_right_fit_link}}\r\n\r\n" +
  "The answer is recorded against your name, so please do not forward this email for someone else to answer.\r\n\r\n" +
  "{{skip_stage_link}}";

const TOKEN = "d".repeat(64);
const ctx = {
  leadId: "de00679d-33b1-4b11-a58e-c10f06e97810",
  studentFirstName: "Athena",
  studentLastName: "Betras",
  schoolName: "The Academy FL",
  skipStageToken: "8".repeat(64),
  decisionToken: TOKEN,
} as never;

describe("the No — not the right fit button", () => {
  const html = renderLetterHtml({ rawBody: SHADOW_DAYS, subject: "Decision needed: Athena Betras", ctx });

  it("renders all four buttons with no literal braces and no Open the decision", () => {
    expect(html).not.toContain("{{");
    expect(html).not.toContain("Open the decision");
    expect(html).not.toContain("Open this link");
    expect(html).toContain("See entire application");
    expect(html).toContain("Yes — schedule shadow days");
    expect(html).toContain("No — not the right fit");
    expect(html).toContain("Skip next stage");
  });

  it("keeps Jimmy's order", () => {
    const at = (s: string) => html.indexOf(s);
    expect(at("See entire application")).toBeLessThan(at("Yes — schedule shadow days"));
    expect(at("Yes — schedule shadow days")).toBeLessThan(at("No — not the right fit"));
    expect(at("No — not the right fit")).toBeLessThan(at("Skip next stage"));
  });

  it("No is a one-click token link", () => {
    expect(html).toContain(`/decide/${TOKEN}/no`);
  });

  it("No answers only the shadow days question", () => {
    expect(isLinkAnswer("no")).toBe(true);
    expect(branchForLink("invite_to_shadow_days", "no")?.stage).toBe("declined");
    expect(branchForLink("invite_to_apply", "no")).toBeNull();
    expect(wordingFor("invite_to_shadow_days", "no", "Athena")?.button).toBe("No — not the right fit");
    expect(wordingFor("invite_to_apply", "no", "Athena")).toBeNull();
  });
});
