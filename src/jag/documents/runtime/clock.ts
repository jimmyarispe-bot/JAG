let nowFn: () => Date = () => new Date();

export function documentNow(): Date {
  return nowFn();
}

export function setDocumentClockForTests(fn: (() => Date) | null): void {
  nowFn = fn ?? (() => new Date());
}

export function resetDocumentClockForTests(): void {
  nowFn = () => new Date();
}
