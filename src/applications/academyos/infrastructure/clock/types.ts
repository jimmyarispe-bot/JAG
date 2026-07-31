export type ClockProvider = {
  now(): string;
  /** Epoch millis for TTL/cache math. */
  nowMs(): number;
};
