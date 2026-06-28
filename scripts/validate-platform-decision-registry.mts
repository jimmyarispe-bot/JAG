import { validateDecisionRegistry } from "../src/lib/platform/decision/registry/validate";
import "@/lib/platform/decision/registry/register";

const result = validateDecisionRegistry();

if (!result.ok) {
  console.error("Platform decision registry validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log("Platform decision registry validation passed.");
