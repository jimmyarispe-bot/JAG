import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EXEC_NAV, EXEC_NAV_ENABLED } from "@/lib/exec/navigation";

const root = join(process.cwd());

describe("D.1 UX & accessibility remediation", () => {
  it("enables only routes that exist for exec primary nav", () => {
    const enabledHrefs = EXEC_NAV_ENABLED.map((i) => i.href);
    expect(enabledHrefs).toContain("/exec");
    expect(enabledHrefs).toContain("/exec/graph");
    expect(enabledHrefs).not.toContain("/exec/finance");
    expect(EXEC_NAV.some((i) => i.phase === 2 && i.href === "/exec/timeline")).toBe(true);
  });

  it("defines global reduced-motion and focus-visible rules", () => {
    const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain(":focus-visible");
    expect(css).toContain(".skip-link");
  });

  it("ConfirmDialog wires useFocusTrap", () => {
    const src = readFileSync(
      join(root, "src/components/experience-system/interaction/index.tsx"),
      "utf8"
    );
    expect(src).toContain("useFocusTrap(open, dialogRef)");
    expect(src).toContain("previousFocus");
  });

  it("portal accessibility bar does not claim i18n-ready", () => {
    const src = readFileSync(
      join(root, "src/components/portal/PortalAccessibilityBar.tsx"),
      "utf8"
    );
    expect(src).not.toContain("i18n-ready");
    expect(src).toContain("Language: English");
  });

  it("WDS BarChart includes screen-reader data table", () => {
    const src = readFileSync(
      join(root, "src/components/workspace-design-system/charts/Charts.tsx"),
      "utf8"
    );
    expect(src).toContain('role="img"');
    expect(src).toContain('className="sr-only"');
    expect(src).toContain("<table");
  });
});
