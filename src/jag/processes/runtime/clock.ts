/** Injected clock — defaults to wall time; tests freeze for determinism. */

let nowFn: () => Date = () => new Date();

export function processNow(): Date {
  return nowFn();
}

export function setProcessClockForTests(fn: (() => Date) | null): void {
  nowFn = fn ?? (() => new Date());
}

export function resetProcessClockForTests(): void {
  nowFn = () => new Date();
}
