/**
 * RC-5 / E-007 — axe-core on agreed critical routes.
 * /login always runs. Authenticated homes run when storageState exists.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { storageStatePath } from "../../scripts/rc5/personas";
import type { RoleId } from "../../scripts/acceptance/roles";

const REPORT_DIR = "docs/operations/rc5/artifacts";

type RouteCase = {
  id: string;
  path: string;
  role?: RoleId;
  /** When true, route is tested without auth (public). */
  public?: boolean;
};

const ROUTES: RouteCase[] = [
  { id: "login", path: "/login", public: true },
  { id: "portal", path: "/portal", role: "parent" },
  { id: "teacher", path: "/dashboard/teacher", role: "teacher" },
  { id: "exec", path: "/exec", role: "ceo" },
];

function hasAuth(role?: RoleId): boolean {
  return !!role && existsSync(storageStatePath(role));
}

test.describe("RC-5 accessibility (axe)", () => {
  test("login has no critical/serious axe violations", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    mkdirSync(REPORT_DIR, { recursive: true });
    writeFileSync(
      `${REPORT_DIR}/axe-login.json`,
      JSON.stringify(
        {
          url: page.url(),
          violations: results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
          at: new Date().toISOString(),
        },
        null,
        2
      )
    );

    const blockers = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([]);
  });

  for (const route of ROUTES.filter((r) => !r.public)) {
    test.describe(route.id, () => {
      test.use({
        storageState:
          route.role && hasAuth(route.role) ? storageStatePath(route.role) : undefined,
      });

      test(`${route.path} has no critical/serious axe violations`, async ({ page }) => {
        test.skip(!hasAuth(route.role), `No storageState for ${route.role} — authenticated axe deferred`);

        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await expect(page).not.toHaveURL(/\/login(\?|$)/);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();

        mkdirSync(REPORT_DIR, { recursive: true });
        writeFileSync(
          `${REPORT_DIR}/axe-${route.id}.json`,
          JSON.stringify(
            {
              url: page.url(),
              violations: results.violations.map((v) => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                nodes: v.nodes.length,
              })),
              at: new Date().toISOString(),
            },
            null,
            2
          )
        );

        const blockers = results.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious"
        );
        expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([]);
      });
    });
  }
});
