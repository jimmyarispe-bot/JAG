/**
 * RC-5 — authenticated role workflow smoke (closes E-001 when credentials present).
 * Navigates each catalog workflow path and asserts we remain authenticated (not /login).
 */

import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { ROLE_ACCEPTANCE, type RoleId } from "../../scripts/acceptance/roles";
import { storageStatePath } from "../../scripts/rc5/personas";

function hasAuth(role: RoleId): boolean {
  return existsSync(storageStatePath(role));
}

const CRITICAL_SCENARIOS: {
  id: string;
  role: RoleId;
  name: string;
  paths: string[];
}[] = [
  {
    id: "admissions_chain",
    role: "school_leader",
    name: "Admissions → Enrollment → Scheduling → Attendance surface → Billing",
    paths: [
      "/dashboard/admissions",
      "/dashboard/students",
      "/dashboard/scheduling",
      "/dashboard/teacher",
      "/dashboard/finance",
    ],
  },
  {
    id: "teacher_day",
    role: "teacher",
    name: "Teacher schedule → attendance/progress surfaces",
    paths: ["/dashboard/teacher", "/dashboard/scheduling", "/dashboard/students"],
  },
  {
    id: "parent_visibility",
    role: "parent",
    name: "Parent progress → finance → messages",
    paths: ["/portal", "/portal/progress", "/portal/finance", "/portal/messages"],
  },
  {
    id: "finance_chain",
    role: "founder",
    name: "Finance → FI → Executive KPIs",
    paths: [
      "/dashboard/finance",
      "/dashboard/finance/intelligence",
      "/dashboard/executive/kpis",
    ],
  },
  {
    id: "executive_decision",
    role: "ceo",
    name: "Morning Brief → ECC → Intelligence → Audit",
    paths: ["/exec/brief", "/exec", "/dashboard/executive", "/dashboard/admin/security"],
  },
  {
    id: "student_day",
    role: "student",
    name: "Student dashboard → schedule → goals",
    paths: ["/portal/student", "/portal/student/schedule", "/portal/student/goals"],
  },
  {
    id: "employee_hr",
    role: "employee",
    name: "Employee portal → HR",
    paths: ["/dashboard/employee", "/dashboard/hr"],
  },
];

for (const roleDef of ROLE_ACCEPTANCE) {
  test.describe(`RC-5 authenticated: ${roleDef.label}`, () => {
    test.use({
      storageState: hasAuth(roleDef.id) ? storageStatePath(roleDef.id) : undefined,
    });

    test.beforeEach(() => {
      test.skip(!hasAuth(roleDef.id), `No storageState for ${roleDef.id} — set RC5_* credentials`);
    });

    for (const step of roleDef.workflows.filter((w) => w.requiresAuth)) {
      test(`${step.id} ${step.name}`, async ({ page }) => {
        await page.goto(step.path, { waitUntil: "domcontentloaded" });
        await expect(page).not.toHaveURL(/\/login(\?|$)/);
        await expect(page.locator("main, [role='main'], body")).toBeVisible();
      });
    }
  });
}

for (const scenario of CRITICAL_SCENARIOS) {
  test.describe(`RC-5 scenario: ${scenario.id}`, () => {
    test.use({
      storageState: hasAuth(scenario.role) ? storageStatePath(scenario.role) : undefined,
    });

    test(scenario.name, async ({ page }) => {
      test.skip(!hasAuth(scenario.role), `No storageState for ${scenario.role}`);
      for (const path of scenario.paths) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await expect(page).not.toHaveURL(/\/login(\?|$)/);
        await expect(page.locator("main, [role='main'], body")).toBeVisible();
      }
    });
  });
}
