/**
 * Pack-local Academy Way scheduling rules (ported — no Platform Foundation edits).
 * Virtual instruction: start on the hour, end at :50.
 */

export const DEFAULT_VIRTUAL_END_MINUTE = 50;
export const DEFAULT_TIMEZONE = "America/New_York";

/** Parse HH:mm → minutes from midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Virtual classes start on the hour and end at :50. */
export function academyVirtualEndTime(
  start: Date,
  endMinute = DEFAULT_VIRTUAL_END_MINUTE
): Date {
  const end = new Date(start);
  end.setMinutes(endMinute, 0, 0);
  if (end <= start) end.setHours(end.getHours() + 1);
  return end;
}

export function validateVirtualSlot(input: {
  isVirtual: boolean;
  startTime: string;
  endTime: string;
}): string | null {
  if (!input.isVirtual) return null;
  const startMin = timeToMinutes(input.startTime);
  const endMin = timeToMinutes(input.endTime);
  if (startMin % 60 !== 0) {
    return "Virtual classes must begin on the hour.";
  }
  if (endMin % 60 !== DEFAULT_VIRTUAL_END_MINUTE) {
    return `Virtual classes must end at :${String(DEFAULT_VIRTUAL_END_MINUTE).padStart(2, "0")}.`;
  }
  if (endMin <= startMin) {
    return "Virtual class end must be after start.";
  }
  return null;
}

export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function slotOverlaps(
  a: { dayOfWeek: number; startTime: string; endTime: string },
  b: { dayOfWeek: number; startTime: string; endTime: string }
): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  return rangesOverlap(
    timeToMinutes(a.startTime),
    timeToMinutes(a.endTime),
    timeToMinutes(b.startTime),
    timeToMinutes(b.endTime)
  );
}

/** Build ISO datetime from date + HH:mm in a nominal timezone-agnostic local form. */
export function combineDateAndTime(date: string, time: string): string {
  const d = date.slice(0, 10);
  const t = time.length === 5 ? `${time}:00` : time;
  return `${d}T${t}.000Z`;
}

export function hoursBetween(startsAt: string, endsAt: string): number {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  return Math.max(0, Math.round((ms / 3_600_000) * 100) / 100);
}
