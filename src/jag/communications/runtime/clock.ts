let nowFn: () => Date = () => new Date();

export function communicationNow(): Date {
  return nowFn();
}

export function setCommunicationClockForTests(fn: (() => Date) | null): void {
  nowFn = fn ?? (() => new Date());
}

export function resetCommunicationClockForTests(): void {
  nowFn = () => new Date();
}
