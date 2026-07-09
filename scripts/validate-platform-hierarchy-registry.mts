import { validateHierarchyRegistryComplete } from "../src/lib/platform/hierarchy/registry/validate";
import "@/lib/platform/hierarchy/registry/register";
import "@/lib/platform/rules/registry/register";
import "@/lib/platform/events/registry/register";
import "@/lib/platform/workflow/registry/register";
import "@/lib/platform/decision/registry/register";
import "@/lib/platform/ulr/registry/register";

const result = validateHierarchyRegistryComplete();

if (!result.ok) {
  console.error("Platform hierarchy registry validation failed:\n");
  for (const issue of result.issues) {
    console.error(`  [${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

console.log("Platform hierarchy registry validation passed.");
