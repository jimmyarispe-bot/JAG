import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADMISSIONS_CASE_PROFILE_SECTIONS } from "@/lib/admissions/profile/sections";

/**
 * A case section lives in two places and has to be added to both.
 *
 * `ADMISSIONS_CASE_PROFILE_SECTIONS` defines the tab and loads its data.
 * `AdmissionsCaseSectionSwitch` decides what to draw — a static switch rather
 * than a registry lookup, because resolving a "use client" section through the
 * runtime registry breaks the RSC client boundary in a production build.
 *
 * Add the definition and forget the switch and the tab appears, loads its data,
 * and renders "Section module is not registered" — a sentence no member of
 * staff can act on, and one that looks like a broken feature rather than a
 * missing line. That is how the Student Questionnaire shipped.
 *
 * This reads the switch as source rather than importing it, because importing a
 * file full of JSX section components into a unit test pulls in half the design
 * system for no benefit. The check is crude and it is exact.
 */
describe("every case section can actually render", () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      "src/components/admissions/case/sections/AdmissionsCaseSectionSwitch.tsx"
    ),
    "utf8"
  );

  const switchKeys = new Set(
    [...source.matchAll(/case "([a-z_]+)":/g)].map((match) => match[1])
  );

  it("has a case in the switch for each defined section", () => {
    const defined = ADMISSIONS_CASE_PROFILE_SECTIONS.map((section) => section.key);
    const missing = defined.filter((key) => !switchKeys.has(key));
    expect(missing, `sections with no case in AdmissionsCaseSectionSwitch: ${missing.join(", ")}`)
      .toEqual([]);
  });

  it("has no case in the switch for a section nobody defines", () => {
    const defined = new Set(ADMISSIONS_CASE_PROFILE_SECTIONS.map((s) => s.key));
    const orphans = [...switchKeys].filter((key) => !defined.has(key));
    expect(orphans, `switch cases with no section definition: ${orphans.join(", ")}`).toEqual([]);
  });

  it("includes the student questionnaire, which is what caught this", () => {
    expect(switchKeys.has("student_questionnaire")).toBe(true);
  });
});

/**
 * THERE IS A THIRD LIST, AND IT IS THE ONE THAT DECIDES.
 *
 * register-modules.ts holds SECTION_COMPONENTS and registers only the sections
 * that appear in it:
 *
 *     const component = SECTION_COMPONENTS[def.key];
 *     if (!component) continue;
 *
 * getProfileSections reads that registry, so a section missing from this map is
 * never registered, never navigated to, and never drawn — with no error and no
 * warning anywhere.
 *
 * 17 September 2026: the Interest Form section was defined, given a case in the
 * switch, shipped, and deployed Ready to production. It did not exist. The
 * checks above passed the whole time, because they compare the definition with
 * the SWITCH and this is a different file.
 *
 * Read as source for the same reason as above: importing register-modules pulls
 * fifteen client components into a unit test for no benefit.
 */
describe("every case section is actually registered", () => {
  const registerSource = readFileSync(
    resolve(process.cwd(), "src/lib/admissions/profile/sections/register-modules.ts"),
    "utf8"
  );

  /** Keys in the SECTION_COMPONENTS map: `  overview: OverviewSection,` */
  const mapped = new Set(
    [...registerSource.matchAll(/^\s{2}([a-z_]+):\s*[A-Za-z]+Section,/gm)].map((m) => m[1])
  );

  it("found the map to read", () => {
    expect(registerSource).toContain("SECTION_COMPONENTS");
    expect(mapped.size).toBeGreaterThan(10);
  });

  /** THE ONE THAT MATTERS. */
  it("has a component in SECTION_COMPONENTS for each defined section", () => {
    const defined = ADMISSIONS_CASE_PROFILE_SECTIONS.map((s) => s.key);
    const unregistered = defined.filter((key) => !mapped.has(key));
    expect(
      unregistered,
      `defined but never registered, so they render no tab at all: ${unregistered.join(", ")}`
    ).toEqual([]);
  });

  it("registers nothing that is not defined", () => {
    const defined = new Set(ADMISSIONS_CASE_PROFILE_SECTIONS.map((s) => s.key));
    const orphans = [...mapped].filter((key) => !defined.has(key));
    expect(orphans, `mapped components with no definition: ${orphans.join(", ")}`).toEqual([]);
  });

  it("includes the interest form, which is what caught this", () => {
    expect(mapped.has("interest_form")).toBe(true);
  });
});
