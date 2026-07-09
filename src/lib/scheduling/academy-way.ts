/** Academy Way instructional scheduling rules — Scheduling Intelligence™ */

export type AcademySubject = "reading" | "writing" | "math" | "structured_literacy" | "other";

export type JagProgramKey =
  | "structured_literacy"
  | "real_life_math"
  | "litlab"
  | "earthology"
  | "life_lab"
  | "ai_venture_lab_a"
  | "ai_venture_lab_b";

/** The JAG™ Virtual program capacity rules */
export const JAG_VIRTUAL_PROGRAM_RULES: Record<
  JagProgramKey,
  { min: number; max: number; reserveSeatUntilMax?: boolean }
> = {
  structured_literacy: { min: 2, max: 3 },
  real_life_math: { min: 5, max: 6, reserveSeatUntilMax: true },
  litlab: { min: 5, max: 6 },
  earthology: { min: 5, max: 6 },
  life_lab: { min: 8, max: 10 },
  ai_venture_lab_a: { min: 8, max: 10 },
  ai_venture_lab_b: { min: 8, max: 10 },
};

export const DISPLAY_TIMEZONE = "America/New_York";

export const DEFAULT_ACADEMY_WAY_CONFIG = {
  virtualStartOnHour: true,
  virtualEndAtMinute: 50,
  use12HourDisplay: true,
  minReadingSize: 4,
  minWritingSize: 4,
  minMathSize: 4,
  minStructuredLiteracySize: 2,
  tutoringMaxSize: 1,
  allowHsInVirtual: true,
};

export type AcademyWayConfig = typeof DEFAULT_ACADEMY_WAY_CONFIG;

/** Load per-school config from schedule_academy_way_config; falls back to defaults. */
export async function loadAcademyWayConfig(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server-auth").createAuthClient>>,
  schoolId: string
): Promise<AcademyWayConfig> {
  const { data } = await supabase
    .from("schedule_academy_way_config")
    .select("*")
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!data) return { ...DEFAULT_ACADEMY_WAY_CONFIG };

  return {
    virtualStartOnHour: data.virtual_start_on_hour ?? true,
    virtualEndAtMinute: data.virtual_end_at_minute ?? 50,
    use12HourDisplay: data.use_12_hour_display ?? true,
    minReadingSize: data.min_reading_size ?? 4,
    minWritingSize: data.min_writing_size ?? 4,
    minMathSize: data.min_math_size ?? 4,
    minStructuredLiteracySize: data.min_structured_literacy_size ?? 2,
    tutoringMaxSize: data.tutoring_max_size ?? 1,
    allowHsInVirtual: data.allow_hs_in_virtual ?? true,
  };
}

/** Effective max enrollment considering JAG reserve-seat rules (e.g. Real-Life Math). */
export function effectiveSectionCapacity(
  programKey: JagProgramKey | null | undefined,
  maxCapacity: number,
  _config = DEFAULT_ACADEMY_WAY_CONFIG
): number {
  if (!programKey) return maxCapacity;
  const rules = JAG_VIRTUAL_PROGRAM_RULES[programKey];
  if (!rules) return maxCapacity;
  const cap = Math.min(maxCapacity, rules.max);
  if (rules.reserveSeatUntilMax) {
    return Math.max(rules.min, cap - 1);
  }
  return cap;
}

/** Whether a new section may open — existing sections must reach max first. */
export function canOpenNewSection(
  programKey: JagProgramKey | null | undefined,
  enrolledCount: number,
  maxCapacity: number,
  _config = DEFAULT_ACADEMY_WAY_CONFIG
): boolean {
  if (!programKey) return enrolledCount >= maxCapacity;
  const rules = JAG_VIRTUAL_PROGRAM_RULES[programKey];
  if (!rules) return enrolledCount >= maxCapacity;
  return enrolledCount >= rules.max;
}

/** Normalize local time to Eastern for display and conflict comparison. */
export function toEasternDisplay(date: Date | string, sourceTimezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatAcademyTime(d, DISPLAY_TIMEZONE);
}

/** Store local preference window; compute ET equivalent for scheduling engine. */
export function localTimeToEasternMinutes(
  localTime: string,
  _sourceTimezone = "America/New_York"
): number {
  const [h, m] = localTime.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minClassSizeForSubject(
  subject: AcademySubject | null | undefined,
  config = DEFAULT_ACADEMY_WAY_CONFIG
): number {
  switch (subject) {
    case "structured_literacy":
      return config.minStructuredLiteracySize;
    case "reading":
      return config.minReadingSize;
    case "writing":
      return config.minWritingSize;
    case "math":
      return config.minMathSize;
    default:
      return 1;
  }
}

export function maxClassSizeForDelivery(deliveryMode: string): number {
  if (deliveryMode === "tutoring" || deliveryMode === "therapy") return 1;
  return 30;
}

/** Virtual classes start on the hour and end at :50 — returns end time for a given start */
export function academyVirtualEndTime(start: Date, endMinute = 50): Date {
  const end = new Date(start);
  end.setMinutes(endMinute, 0, 0);
  if (end <= start) end.setHours(end.getHours() + 1);
  return end;
}

/** Format time in 12-hour display (no military time) */
export function formatAcademyTime(date: Date | string, timezone = "America/New_York"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });
}

export function validateSectionAgainstAcademyWay(input: {
  academySubject?: AcademySubject | null;
  deliveryMode?: string;
  minCapacity?: number;
  maxCapacity?: number;
  enrolledCount?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const min = minClassSizeForSubject(input.academySubject);
  const max = maxClassSizeForDelivery(input.deliveryMode ?? "virtual");

  if ((input.minCapacity ?? min) < min) {
    errors.push(`Minimum class size for ${input.academySubject ?? "subject"} is ${min}`);
  }
  if ((input.maxCapacity ?? max) > max && input.deliveryMode === "tutoring") {
    errors.push("Tutoring sessions must be 1:1");
  }
  if (input.enrolledCount !== undefined && input.enrolledCount > (input.maxCapacity ?? max)) {
    errors.push("Enrollment exceeds section capacity");
  }
  return { valid: errors.length === 0, errors };
}

export function structuredLiteracyLabel(level?: number | null, step?: number | null): string {
  if (!level) return "—";
  return step ? `Level ${level}, Step ${step}` : `Level ${level}`;
}

export function academyLevelLabel(level?: number | null): string {
  if (!level) return "—";
  return `Level ${level}`;
}
