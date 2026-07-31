import type { JagStartupResult } from "@/jag/runtime/types";

let startup: JagStartupResult | null = null;
let starter: (() => JagStartupResult) | null = null;

export function bindJagStarter(fn: () => JagStartupResult): void {
  starter = fn;
}

export function recordJagStartup(result: JagStartupResult): void {
  startup = result;
}

export function getJagStartup(): JagStartupResult | null {
  return startup;
}

export function ensureJAGBooted(): JagStartupResult {
  if (startup?.ok && startup.container?.ready) {
    return startup;
  }
  if (!starter) {
    throw new Error(
      "JAG starter not bound. Import @/jag/runtime (startJAG) before ensureJAGBooted()."
    );
  }
  startup = starter();
  return startup;
}

export function resetJagBootForTests(): void {
  startup = null;
}
