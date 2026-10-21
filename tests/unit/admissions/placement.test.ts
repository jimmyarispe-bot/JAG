import { describe, expect, it } from "vitest";

import {
  HS_OPTION_EXPERIENCE,
  HS_OPTION_MATH_TUTORING,
  HS_OPTION_SL_TUTORING,
  describeChoice,
  placementFromForm,
} from "@/lib/admissions/placement";

function form(entries: [string, string][]): FormData {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
}

describe("HS placement at Accept", () => {
  it("needs a class and a start date", () => {
    expect(placementFromForm(form([]))).toEqual({ ok: false, error: "Choose at least one class." });
    expect(placementFromForm(form([["placement_option", HS_OPTION_EXPERIENCE]]))).toMatchObject({ ok: false });
  });

  it("requires days for tutoring", () => {
    const r = placementFromForm(
      form([["placement_option", HS_OPTION_SL_TUTORING], ["actual_start_date", "2026-11-02"]])
    );
    expect(r.ok).toBe(false);
  });

  it("keeps the days and ignores options it does not know", () => {
    const r = placementFromForm(
      form([
        ["placement_option", HS_OPTION_EXPERIENCE],
        ["placement_option", HS_OPTION_MATH_TUTORING],
        ["placement_option", "Something else"],
        ["placement_math_days", "8"],
        ["actual_start_date", "2026-11-02"],
      ])
    );
    expect(r).toEqual({
      ok: true,
      value: {
        options: [HS_OPTION_EXPERIENCE, HS_OPTION_MATH_TUTORING],
        slTutoringDays: null,
        mathTutoringDays: 8,
        actualStartDate: "2026-11-02",
      },
    });
    if (r.ok) expect(describeChoice(r.value)).toContain("Math 1:1 Tutoring, 8 days/month");
  });
});
