import { validateExecutionEngineRegistry } from "../src/lib/platform/execution-engine/registry/validate";
import "@/lib/platform/execution-engine/registry/register";
import "@/lib/platform/hierarchy/registry/register";

const result = validateExecutionEngineRegistry();

if (!result.ok) {
  console.error("Platform execution engine validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log("Platform execution engine validation passed.");
