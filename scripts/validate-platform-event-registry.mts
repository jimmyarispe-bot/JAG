import { validateEventRegistry } from "../src/lib/platform/events/registry/validate";
import "@/lib/platform/events/registry/register";

const result = validateEventRegistry();

if (!result.ok) {
  console.error("Platform event registry validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log("Platform event registry validation passed.");
