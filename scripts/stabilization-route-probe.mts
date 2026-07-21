/**
 * Sprint 2.5/2.6 — authenticated route probe.
 * Usage:
 *   npx tsx scripts/stabilization-route-probe.mts
 *
 * Reads from process env or .env.local (values are never logged):
 *   STABILIZATION_EMAIL (defaults to jimmy@theacademyway.org)
 *   STABILIZATION_PASSWORD (optional if SUPABASE_SERVICE_ROLE_KEY is set — uses magic link)
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (applies FOUNDER role before probe)
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium, type ConsoleMessage, type Page } from "@playwright/test";

function loadLocalEnvVar(name: string): string {
  if (process.env[name]) return process.env[name]!;
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return "";
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== name) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return "";
}

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const EMAIL = loadLocalEnvVar("STABILIZATION_EMAIL") || "jimmy@theacademyway.org";
const PASSWORD = loadLocalEnvVar("STABILIZATION_PASSWORD");
const SUPABASE_URL = loadLocalEnvVar("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = loadLocalEnvVar("SUPABASE_SERVICE_ROLE_KEY");

const ROUTES = [
  "/dashboard",
  "/dashboard/admissions",
  "/dashboard/students",
  "/dashboard/scheduling",
  "/dashboard/teacher",
  "/dashboard/finance",
  "/dashboard/hr",
  "/dashboard/mission-control",
  "/dashboard/executive",
] as const;

type RouteResult = {
  route: string;
  pass: boolean;
  loadMs: number;
  finalUrl: string;
  redirected: boolean;
  httpStatus: number | null;
  pageError: string | null;
  consoleErrors: string[];
  notes: string[];
};

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureFounderRole(email: string): Promise<string | null> {
  const admin = adminClient();
  if (!admin) return null;

  const { data: user, error: userError } = await admin
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (userError || !user) return `Founder role seed skipped: user not found (${userError?.message ?? email})`;

  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id")
    .eq("name", "FOUNDER")
    .single();
  if (roleError || !role) return `Founder role seed skipped: FOUNDER role missing (${roleError?.message})`;

  const { error: insertError } = await admin.from("user_roles").upsert(
    { user_id: user.id, role_id: role.id },
    { onConflict: "user_id,role_id", ignoreDuplicates: true }
  );
  if (insertError) return `Founder role seed failed: ${insertError.message}`;
  return null;
}

async function loginWithPassword(page: Page): Promise<void> {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email address").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD!);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
}

async function loginWithMagicLink(page: Page): Promise<void> {
  const admin = adminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY required for magic-link login");

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: EMAIL,
    options: { redirectTo: `${BASE}/dashboard` },
  });
  if (error || !data.properties?.action_link) {
    throw new Error(error?.message ?? "Magic link generation failed");
  }

  await page.goto(data.properties.action_link);
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 60_000 });
}

async function login(page: Page): Promise<void> {
  if (PASSWORD) {
    await loginWithPassword(page);
    return;
  }
  await loginWithMagicLink(page);
}

async function verifySidebarNavigation(page: Page): Promise<{ pass: boolean; notes: string[] }> {
  const notes: string[] = [];
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1000);

  const studentsLink = page.locator('aside a[href="/dashboard/students"]').first();
  if ((await studentsLink.count()) === 0) {
    notes.push("Students sidebar link not found");
    return { pass: false, notes };
  }

  await studentsLink.click();
  try {
    await page.waitForURL((url) => url.pathname.startsWith("/dashboard/students"), {
      timeout: 15_000,
    });
  } catch {
    notes.push(`Sidebar click did not navigate; URL is ${page.url()}`);
    return { pass: false, notes };
  }

  return { pass: true, notes };
}

async function probeRoute(page: Page, route: string): Promise<RouteResult> {
  const consoleErrors: string[] = [];
  const notes: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  page.on("console", handler);

  let httpStatus: number | null = null;
  let pageError: string | null = null;
  const start = Date.now();

  try {
    const response = await page.goto(`${BASE}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    httpStatus = response?.status() ?? null;
    await page.waitForTimeout(1500);
  } catch (err) {
    pageError = err instanceof Error ? err.message : String(err);
  }

  const loadMs = Date.now() - start;
  const finalUrl = page.url();
  const redirected = !finalUrl.endsWith(route) && finalUrl !== `${BASE}${route}`;

  page.off("console", handler);

  const bodyText = await page.locator("body").innerText().catch(() => "");
  if (/403|forbidden|not authorized|access denied/i.test(bodyText)) {
    notes.push("Possible permission denial in page body");
  }
  if (/something went wrong|application error|internal server error/i.test(bodyText)) {
    notes.push("Error message visible in page body");
  }
  if (finalUrl.includes("/login")) {
    notes.push("Redirected to login");
  }
  if (finalUrl === `${BASE}/dashboard` && route !== "/dashboard") {
    notes.push("Redirected to /dashboard (likely missing permission)");
  }
  if (finalUrl.includes("/login/reset-required")) {
    notes.push("Password reset required");
  }

  const pass =
    !pageError &&
    !finalUrl.includes("/login") &&
    !(finalUrl === `${BASE}/dashboard` && route !== "/dashboard") &&
    !notes.some((n) => n.includes("Error message")) &&
    (httpStatus === null || httpStatus < 500);

  return {
    route,
    pass,
    loadMs,
    finalUrl,
    redirected,
    httpStatus,
    pageError,
    consoleErrors: consoleErrors.slice(0, 5),
    notes,
  };
}

async function main() {
  if (!PASSWORD && !SERVICE_ROLE_KEY) {
    console.error(
      "Set STABILIZATION_PASSWORD or SUPABASE_SERVICE_ROLE_KEY (in .env.local) to run authenticated probes."
    );
    process.exit(2);
  }

  const founderSeedNote = await ensureFounderRole(EMAIL);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await login(page);
  } catch (err) {
    console.error("Login failed:", err instanceof Error ? err.message : err);
    await browser.close();
    process.exit(1);
  }

  const sidebar = await verifySidebarNavigation(page);

  const results: RouteResult[] = [];
  for (const route of ROUTES) {
    results.push(await probeRoute(page, route));
  }

  await browser.close();

  const allRoutesPass = results.every((r) => r.pass);
  const overallPass = allRoutesPass && sidebar.pass;

  console.log(
    JSON.stringify(
      {
        base: BASE,
        email: EMAIL,
        founderSeedNote,
        sidebarNavigation: sidebar,
        overallPass,
        results,
      },
      null,
      2
    )
  );

  process.exit(overallPass ? 0 : 1);
}

main();
