import { describe, expect, it } from "vitest";
import {
  buildMergeValues,
  renderTemplate,
  type MergeContext,
} from "@/lib/admissions/communications/merge-fields";
import {
  COMMUNICATION_CHANNELS,
  CHANNEL_LABELS,
  MERGE_FIELDS,
} from "@/lib/admissions/communications/types";

/**
 * The school's admissions contact, and the reason there are two versions of the
 * inquiry confirmation.
 */

const BASE: MergeContext = {
  studentFirstName: "Samuel",
  studentLastName: "Unnasch",
  guardianFirstName: "Laura",
  guardianLastName: "Unnasch",
  guardianEmail: "laura.unnasch@example.com",
  schoolName: "The Academy Virtual",
  leadId: "11111111-2222-4333-8444-555555555555",
};

describe("school admissions contact merge fields", () => {
  it("renders the school's booking link, contact and lead link", () => {
    const values = buildMergeValues({
      ...BASE,
      admissionsContactName: "Vanessa Alvarado",
      admissionsContactEmail: "vanessa@theacademyway.org",
      schedulingUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZ123",
    });

    expect(values.scheduling_link).toBe(
      "https://calendar.google.com/calendar/appointments/schedules/AcZ123"
    );
    expect(values.admissions_contact_name).toBe("Vanessa Alvarado");
    expect(values.admissions_contact_email).toBe("vanessa@theacademyway.org");
    expect(values.lead_link).toContain(`/dashboard/admissions/leads/${BASE.leadId}`);
  });

  it("falls back to a generic signature rather than an empty name", () => {
    const values = buildMergeValues(BASE);
    expect(values.admissions_contact_name).toBe("Admissions");
    expect(values.scheduling_link).toBe("");
  });

  /**
   * The whole reason the sender picks between two templates rather than
   * rendering one and hoping. If this ever starts passing with the token
   * substituted, the guard in triggerCommunications can go.
   */
  it("leaves an UNKNOWN token in the body verbatim — which is why the guard exists", () => {
    const out = renderTemplate("Book here: {{not_a_real_field}}", BASE);
    expect(out).toBe("Book here: {{not_a_real_field}}");
  });

  it("renders a known-but-unset link as nothing, never as a placeholder", () => {
    const out = renderTemplate("Book here: {{scheduling_link}}", BASE);
    expect(out).toBe("Book here: ");
    expect(out).not.toContain("{{");
  });

  it("substitutes the contact into a signature", () => {
    const out = renderTemplate(
      "Warm regards,\n{{admissions_contact_name}}\n{{school_name}}",
      { ...BASE, admissionsContactName: "Vanessa Alvarado" }
    );
    expect(out).toBe("Warm regards,\nVanessa Alvarado\nThe Academy Virtual");
  });
});

describe("staff_email channel", () => {
  it("is a real channel with a label, so the admin UI cannot render undefined", () => {
    expect(COMMUNICATION_CHANNELS).toContain("staff_email");
    expect(CHANNEL_LABELS.staff_email).toBeTruthy();
  });

  it("every channel has a label", () => {
    for (const channel of COMMUNICATION_CHANNELS) {
      expect(CHANNEL_LABELS[channel], `no label for ${channel}`).toBeTruthy();
    }
  });

  it("every declared merge field is produced by buildMergeValues", () => {
    const values = buildMergeValues(BASE);
    for (const field of MERGE_FIELDS) {
      expect(values, `buildMergeValues is missing ${field}`).toHaveProperty(field);
    }
  });
});
