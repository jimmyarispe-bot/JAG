import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The wizard must not destroy what a family types.
 *
 * This is the second half of the bug commit f83b2c8 was named for. That one
 * fixed ABSENT fields: the wizard renders one step at a time, so every other
 * step's keys were missing from the submission and `formData.get()` returned
 * null, blanking columns the family had already filled. The fix was a presence
 * check in saveApplicationDetails — a field the step did not render is left
 * alone.
 *
 * That fix is correct and complete for what it covers, and it rests on an
 * assumption nobody wrote down: one column, one step. `previous_school` breaks
 * it. Step 3 "Educational history" renders it as an input. Step 7 "Previous
 * schools" renders it again as a textarea. On step 7 the field IS present, so
 * the presence check waves it through — and its value came from `defaults`, the
 * server snapshot taken when the page loaded, which still says empty. A family
 * who typed their school on step 3 and pressed Save & continue on step 7 had it
 * overwritten with null, behind a "Draft saved" toast.
 *
 * Worse than a click: the 45-second autosave did it on its own, to a family who
 * had walked away from the keyboard.
 *
 * The fix holds the answers in React state instead of in `defaults`, so a field
 * rendered twice shows the same live value both times. These tests assert the
 * mechanism, because the bug is invisible in any single step read on its own.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
/** Assert on code, not on the comments that describe it. */
const code = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const wizard = code(read("src/components/admissions/experience/ApplicationWizard.tsx"));
const actions = code(read("src/lib/admissions/portal/actions.ts"));

describe("the snapshot is read once and never again", () => {
  it("seeds state from defaults in exactly one place", () => {
    expect(wizard).toContain("function seedValues(defaults: Defaults): WizardValues");
    expect(wizard).toContain("useState<WizardValues>(() => seedValues(defaults))");
  });

  /**
   * THE ONE THAT MATTERS. Every `defaults.x` outside seedValues is a field
   * seeded from the page-load snapshot, which is how the bug worked.
   */
  it("no field reads defaults directly", () => {
    const seedStart = wizard.indexOf("function seedValues");
    const seedEnd = wizard.indexOf("}", wizard.indexOf("emergency_contact_phone:", seedStart));
    const outsideSeed = wizard.slice(0, seedStart) + wizard.slice(seedEnd);
    expect(outsideSeed).not.toMatch(/defaults\./);
  });

  it("uses no defaultValue anywhere, which is what made staleness possible", () => {
    expect(wizard).not.toContain("defaultValue");
  });
});

describe("every column the wizard writes is controlled", () => {
  const columns = [
    "guardian_notes",
    "student_summary",
    "previous_school",
    "medical_notes",
    "learning_needs_summary",
    "emergency_contact_name",
    "emergency_contact_phone",
  ];

  it("binds each to state and to a change handler", () => {
    for (const c of columns) {
      expect(wizard).toContain(`value={values.${c}}`);
      expect(wizard).toContain(`onChange={set("${c}")}`);
    }
  });

  /**
   * previous_school is rendered twice on purpose — step 3 and step 7 — and both
   * must point at the same live value. If a third ever appears it inherits the
   * fix for free; what must never return is one of them reading a snapshot.
   */
  it("renders previous_school twice, both bound to the same value", () => {
    const bound = wizard.match(/value=\{values\.previous_school\}/g) ?? [];
    expect(bound.length).toBe(2);
  });

  it("covers exactly the columns the server will write", () => {
    const allowlist = actions.slice(
      actions.indexOf("const APPLICATION_DETAIL_FIELDS"),
      actions.indexOf("] as const", actions.indexOf("const APPLICATION_DETAIL_FIELDS"))
    );
    for (const c of columns) expect(allowlist).toContain(`"${c}"`);
    // And nothing the server accepts is left unbound in the wizard.
    const accepted = allowlist.match(/"([a-z_]+)"/g)?.map((s) => s.replace(/"/g, "")) ?? [];
    expect(new Set(accepted)).toEqual(new Set(columns));
  });
});

describe("the server still refuses to write what a step did not render", () => {
  /** The f83b2c8 half of the fix. Both halves are needed; neither is enough. */
  it("keeps the presence check", () => {
    expect(actions).toContain("if (!formData.has(field)) continue;");
  });
});

describe("a failed autosave is never silent", () => {
  /**
   * It used to be `.catch(() => undefined)`, under a label still reading
   * "Autosaved 2:15 PM" from the last time it worked. Zero rows with no error is
   * a refusal wearing a success costume; so is a discarded exception.
   */
  it("records the failure rather than discarding it", () => {
    expect(wizard).not.toContain("catch(() => undefined)");
    expect(wizard).toContain("catch(() => setAutosaveFailed(true))");
  });

  it("clears the failure once a save gets through", () => {
    expect(wizard).toMatch(/setSavedAt\(new Date\(\)[\s\S]{0,80}setAutosaveFailed\(false\)/);
  });

  it("says so where the family is looking, not only in a banner", () => {
    expect(wizard).toContain("Not saved — check your connection");
    expect(wizard).toContain("We could not save your draft just now.");
  });

  /** Telling them to close the tab and come back would lose the typing. */
  it("tells the family to stay on the page", () => {
    expect(wizard).toContain("rather than closing the tab");
  });
});
