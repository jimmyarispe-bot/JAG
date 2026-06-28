import { validateGraphRegistry } from "../src/lib/platform/intelligence-graph/registry/validate";
import "@/lib/platform/intelligence-graph/registry/register";

const result = validateGraphRegistry();

if (!result.ok) {
  console.error("Platform intelligence graph registry validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log("Platform intelligence graph registry validation passed.");
