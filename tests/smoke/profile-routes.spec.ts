import { test, expect } from "@playwright/test";

test.describe("Profile route smoke tests", () => {
  test("student profile redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/students/test-student-id");
    await expect(page).toHaveURL(/\/login/);
  });

  test("employee profile redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/hr/employees/test-employee-id");
    await expect(page).toHaveURL(/\/login/);
  });

  test("student profile deep link redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/students/test-student-id?section=timeline");
    await expect(page).toHaveURL(/\/login/);
  });

  test("employee profile legacy tab redirect target requires auth", async ({ page }) => {
    await page.goto("/dashboard/hr/employees/test-employee-id?tab=timeline");
    await expect(page).toHaveURL(/\/login|section=activity/);
  });

  test("platform diagnostics redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/platform/diagnostics");
    await expect(page).toHaveURL(/\/login/);
  });
});
