import type { ValidationScenarioResult } from "./types";

type ValidationStore = {
  runs: ValidationScenarioResult[];
};

const g = globalThis as typeof globalThis & {
  __academyOsValidationStore?: ValidationStore;
};

function empty(): ValidationStore {
  return { runs: [] };
}

function store(): ValidationStore {
  if (!g.__academyOsValidationStore) g.__academyOsValidationStore = empty();
  return g.__academyOsValidationStore;
}

export function resetValidationStoreForTests(): void {
  g.__academyOsValidationStore = empty();
}

export function appendValidationRun(
  result: ValidationScenarioResult
): ValidationScenarioResult {
  store().runs.push(result);
  return result;
}

export function listValidationRuns(): ValidationScenarioResult[] {
  return [...store().runs];
}

export function clearValidationRuns(): void {
  store().runs = [];
}
