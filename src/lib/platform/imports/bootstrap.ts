import { registerImporter } from "./registry";
import { StudentImporter } from "./entities/student/importer";

let bootstrapped = false;

/** Ensure default entity importers are registered (idempotent). */
export function bootstrapImportRegistry(): void {
  if (bootstrapped) return;
  registerImporter(StudentImporter, { overwrite: true });
  bootstrapped = true;
}

bootstrapImportRegistry();
