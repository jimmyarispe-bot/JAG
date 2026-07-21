import { test, expect } from "@playwright/test";

/**
 * RC-4 — unauthenticated role home gates (must redirect to login).
 * Authenticated journeys require RC4_E2E_COOKIE / staging personas (E-001).
 */

const ROLE_HOMES = [
  { role: "Founder", path: "/dashboard" },
  { role: "CEO / ECC", path: "/exec" },
  { role: "School Leader admissions", path: "/dashboard/admissions" },
  { role: "Teacher", path: "/dashboard/teacher" },
  { role: "Parent", path: "/portal" },
  { role: "Student", path: "/portal/student" },
  { role: "Employee", path: "/dashboard/employee" },
  { role: "Finance", path: "/dashboard/finance" },
  { role: "HR", path: "/dashboard/hr" },
  { role: "Executive Intelligence", path: "/dashboard/executive" },
] as const;

test.describe("RC-4 role auth gates", () => {
  for (const home of ROLE_HOMES) {
    test(`${home.role} (${home.path}) redirects when unauthenticated`, async ({ page }) => {
      await page.goto(home.path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("login form supports keyboard-critical fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").focus();
    await expect(page.getByLabel("Email address")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password")).toBeFocused();
  });
});
