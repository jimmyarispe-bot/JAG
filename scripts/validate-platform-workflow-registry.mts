import { validateWorkflowRegistry } from "../src/lib/platform/workflow/registry/validate";
import "@/lib/platform/workflow/registry/register";

const result = validateWorkflowRegistry();

if (!result.ok) {
  console.error("Platform workflow registry validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log("Platform workflow registry validation passed.");
