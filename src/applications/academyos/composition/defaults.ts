import type {
  AcademyClock,
  AcademyIdGenerator,
} from "@/applications/academyos/composition/types";

export function createSystemClock(): AcademyClock {
  return {
    now: () => new Date().toISOString(),
  };
}

export function createSystemIdGenerator(): AcademyIdGenerator {
  return {
    next(prefix: string) {
      const stamp = Date.now().toString(36);
      const rand = Math.random().toString(36).slice(2, 10);
      return `${prefix}_${stamp}_${rand}`;
    },
  };
}
