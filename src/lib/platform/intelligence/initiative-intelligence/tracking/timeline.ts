/**
 * Timeline / schedule variance helpers.
 */

export function scheduleVarianceDays(
  targetCompletionDate: string | undefined,
  now: Date,
  percentComplete: number
): number {
  if (!targetCompletionDate) return 0;
  const target = new Date(targetCompletionDate).getTime();
  if (Number.isNaN(target)) return 0;
  const remainingPct = Math.max(0, 100 - percentComplete) / 100;
  const msLeft = target - now.getTime();
  const daysLeft = msLeft / (1000 * 60 * 60 * 24);
  // Negative = behind schedule when little time remains relative to remaining work.
  if (remainingPct === 0) return Math.round(daysLeft);
  const expectedDaysForRemaining = Math.max(1, daysLeft);
  const pressure = remainingPct * 30 - expectedDaysForRemaining;
  return Math.round(-pressure);
}
