import { describe, it, expect } from "vitest";
import { renderLetterHtml } from "@/lib/admissions/communications/letter-html";
import { DECISION_LETTER_EVENT } from "@/lib/admissions/gates/definitions";
import { branchForLink, wordingFor } from "@/lib/admissions/gates/answer-by-link";

/**
 * THE THREE "DECISION NEEDED" LETTERS, 17 October 2026 (migration 567).
 *
 * Jimmy: delete "Open the decision", add "Yes — schedule shadow days" and
 * "See entire application", keep "Skip next stage" - then three letters, one
 * per question. The bodies below are 567's, \r\n and all.
 */

const SEND_APPLICATION =
  "{{student_full_name}} is waiting for you to send {{student_first_name}}'s Application for Admissions.\r\n" +
  "Click the Yes button below to send the email to {{student_first_name}}'s parent with the application.\r\n" +
  "{{send_application_link}}\r\n\r\n{{record_link}}\r\n\r\n" +
  "The answer is recorded against your name, so please do not forward this email for someone else to answer.\r\n\r\n" +
  "{{skip_stage_link}}";

const SHADOW_DAYS =
  "{{student_full_name}} is waiting for you to send {{student_first_name}}'s Shadow Day invitation.\r\n" +
  "Click the Yes button below to send the email to {{student_first_name}}'s parent to schedule {{student_first_name}}'s Shadow Days.\r\n" +
  "{{invite_shadow_days_link}}\r\n\r\n{{application_view_link}}\r\n\r\n" +
  "The answer is recorded against your name, so please do not forward this email for someone else to answer.\r\n\r\n" +
  "{{skip_stage_link}}";

const ACCEPT_OR_DENY =
  "{{student_full_name}} is waiting for your admissions decision.\r\n" +
  "Click Accept or Deny below to send the email to {{student_first_name}}'s parent.\r\n" +
  "{{accept_link}}\r\n\r\n{{deny_link}}\r\n\r\n{{application_view_link}}\r\n\r\n" +
  "The answer is recorded against your name, so please do not forward this email for someone else to answer.";

const TOKEN = "d".repeat(64);
const ctx = {
  leadId: "de00679d-33b1-4b11-a58e-c10f06e97810",
  studentFirstName: "Athena",
  studentLastName: "Betras",
  schoolName: "The Academy FL",
  skipStageToken: "8".repeat(64),
  decisionToken: TOKEN,
} as never;

function render(body: string) {
  return renderLetterHtml({ rawBody: body, subject: "Decision needed: Athena Betras", ctx });
}

describe("the three Decision needed letters", () => {
  it("none carries Open the decision, and none mails literal braces", () => {
    for (const body of [SEND_APPLICATION, SHADOW_DAYS, ACCEPT_OR_DENY]) {
      const html = render(body);
      expect(html).not.toContain("Open the decision");
      expect(html).not.toContain("{{");
      expect(html).not.toContain("Open this link");
    }
  });

  it("the shadow days letter carries Jimmy's two buttons and the skip", () => {
    const html = render(SHADOW_DAYS);
    expect(html).toContain("Yes — schedule shadow days");
    expect(html).toContain(`/decide/${TOKEN}/yes`);
    expect(html).toContain("See entire application");
    expect(html).toContain("?section=applications");
    expect(html).toContain("Skip next stage");
  });

  it("the send-the-application letter names the child on the record button", () => {
    const html = render(SEND_APPLICATION);
    expect(html).toContain("Yes — send the application");
    expect(html).toContain(`/decide/${TOKEN}/yes`);
    expect(html).toMatch(/See Athena(&#39;|&#x27;|')s record/);
    expect(html).toContain("Skip next stage");
  });

  it("the accept-or-deny letter has both answers and no skip", () => {
    const html = render(ACCEPT_OR_DENY);
    expect(html).toContain("Accept — send email");
    expect(html).toContain(`/decide/${TOKEN}/accept`);
    expect(html).toContain("Deny — send email");
    expect(html).toContain(`/decide/${TOKEN}/deny`);
    expect(html).toContain("See entire application");
    expect(html).not.toContain("Skip next stage");
  });

  it("falls back to the case page when a lead has no token", () => {
    const html = renderLetterHtml({
      rawBody: SHADOW_DAYS,
      subject: "Decision needed",
      ctx: { ...(ctx as object), decisionToken: null } as never,
    });
    expect(html).not.toContain("/decide/");
    expect(html).toContain("?section=decisions");
  });
});

describe("one letter per question", () => {
  it("maps every gate to its own letter", () => {
    expect(DECISION_LETTER_EVENT).toEqual({
      invite_to_apply: "decision_gate_opened",
      invite_to_shadow_days: "staff_shadow_days_decision",
      accept_or_deny: "staff_admission_decision",
    });
  });
});

describe("what a link may answer", () => {
  it("answers the question open now, and only with that question's answers", () => {
    expect(branchForLink("invite_to_shadow_days", "yes")?.familyEvent).toBe("shadow_days_invited");
    expect(branchForLink("invite_to_apply", "yes")?.familyEvent).toBe("application_invited");
    expect(branchForLink("accept_or_deny", "accept")?.delegatesToDecision).toBe("accept");
    expect(branchForLink("accept_or_deny", "deny")?.delegatesToDecision).toBe("deny");
    expect(branchForLink("accept_or_deny", "yes")).toBeNull();
    expect(branchForLink("invite_to_shadow_days", "accept")).toBeNull();
    expect(branchForLink(null, "yes")).toBeNull();
  });

  it("the page asks in the button's own words", () => {
    expect(wordingFor("invite_to_shadow_days", "yes", "Athena")).toEqual({
      question: "Send Athena's Shadow Day invitation?",
      button: "Yes — schedule shadow days",
    });
    expect(wordingFor("accept_or_deny", "yes", "Athena")).toBeNull();
  });
});
