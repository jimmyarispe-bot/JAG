import type { HardeningSuiteResult, Rc2ReleaseReadinessDashboard } from "./types";

type HardeningStore = {
  suites: HardeningSuiteResult[];
  lastDashboard: Rc2ReleaseReadinessDashboard | null;
};

const g = globalThis as typeof globalThis & {
  __academyOsHardeningStore?: HardeningStore;
};

function empty(): HardeningStore {
  return { suites: [], lastDashboard: null };
}

function store(): HardeningStore {
  if (!g.__academyOsHardeningStore) g.__academyOsHardeningStore = empty();
  return g.__academyOsHardeningStore;
}

export function resetHardeningStoreForTests(): void {
  g.__academyOsHardeningStore = empty();
}

export function appendHardeningSuite(
  result: HardeningSuiteResult
): HardeningSuiteResult {
  store().suites.push(result);
  return result;
}

export function listHardeningSuites(): HardeningSuiteResult[] {
  return [...store().suites];
}

export function setLastRc2Dashboard(
  dashboard: Rc2ReleaseReadinessDashboard
): void {
  store().lastDashboard = dashboard;
}

export function getLastRc2Dashboard(): Rc2ReleaseReadinessDashboard | null {
  return store().lastDashboard;
}
