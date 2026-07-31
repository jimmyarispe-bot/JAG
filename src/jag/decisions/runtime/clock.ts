let nowFn: () => Date = () => new Date();

export function decisionNow(): Date {
  return nowFn();
}

export function setDecisionClockForTests(fn: (() => Date) | null): void {
  nowFn = fn ?? (() => new Date());
}

export function resetDecisionClockForTests(): void {
  nowFn = () => new Date();
}
