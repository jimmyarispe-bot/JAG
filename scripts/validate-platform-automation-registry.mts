import { validateAutomationRegistry } from "../src/lib/platform/automation/registry/validate";
import "@/lib/platform/automation/registry/register";

const result = validateAutomationRegistry();

if (!result.ok) {
  console.error("Platform automation registry validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log("Platform automation registry validation passed.");
