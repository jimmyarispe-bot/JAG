/**
 * PROVE THE ACADEMY FL CAN ACTUALLY SEND — one-off, 22 September 2026.
 *
 * WHY THIS EXISTS. The Academy FL has never had a single successful email in
 * admissions_communications. Its two sends - Dominic Anders' and Deidra
 * Williams' application invites, both 15 Sep 2026 - failed because
 * theacademyfl.org was not verified in Resend at the time. Resend now shows the
 * domain Verified, but that list column is "Created", not "Verified at", so
 * nothing on screen proves FL can send TODAY.
 *
 * WHAT IT DOES. Sends one email from the real FL from-address to Jimmy, through
 * sendTransactionalEmail() - the exact function admissions email uses. Not a
 * mock and not a different provider path, because a test down a different road
 * proves nothing about the road parents are on.
 *
 * WHAT IT DOES NOT DO. It writes nothing. No admissions_communications row, no
 * lead touched, no parent contacted. Run it as many times as you like.
 *
 * READING THE RESULT.
 *   ok: true   - FL genuinely sends. Dominic and Deidra can be re-sent.
 *   ok: false  - the error is printed verbatim. "domain is not verified" means
 *                FL is still not fixed, whatever the dashboard says.
 *
 * RUN IT:
 *   npx tsx scripts/admissions/prove-fl-can-send.mts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* The FL from-address exactly as schools.admissions_from_email holds it. */
const FL_FROM = "danni.treu@theacademyfl.org";
const TEST_RECIPIENT = "jimmy.arispe@gmail.com";

/**
 * Load .env.local by hand rather than depending on a dotenv package this repo
 * does not install. Only the keys the email provider reads are lifted, and no
 * value is ever printed.
 */
function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.error(`Could not read ${path}. Run this from the repo root.`);
    process.exit(1);
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  if (!process.env.RESEND_API_KEY?.trim()) {
    console.error("RESEND_API_KEY is not set in .env.local. Nothing was sent.");
    process.exit(1);
  }

  /* Imported AFTER the env is populated: the provider caches its client on
     first use, reading RESEND_API_KEY at that moment. */
  const { sendTransactionalEmail } = await import("@/lib/platform/email");

  const stamp = new Date().toISOString();

  console.log(`Sending from ${FL_FROM} to ${TEST_RECIPIENT} ...`);

  const result = await sendTransactionalEmail({
    to: TEST_RECIPIENT,
    from: FL_FROM,
    fromName: "The Academy FL",
    subject: `FL send test — ${stamp}`,
    body:
      "This is a one-off test of The Academy FL sending domain.\n\n" +
      "If you are reading this, theacademyfl.org is verified in Resend and " +
      "admissions email from the FL campus will reach parents.\n\n" +
      "No family received this message and nothing was recorded against any lead.",
  });

  console.log("");
  if (result.success) {
    console.log("PASS — Resend accepted the message.");
    console.log("The Academy FL can send. Check your inbox to confirm delivery.");
  } else {
    console.log("FAIL — Resend rejected the message.");
    console.log(`Reason: ${result.error ?? "(no error text returned)"}`);
    console.log("");
    console.log("Do not re-send Dominic's or Deidra's invites until this passes.");
  }
}

main().catch((err) => {
  console.error("The test itself failed to run:");
  console.error(err);
  process.exit(1);
});
