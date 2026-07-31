import type { AcademyIdGenerator } from "@/applications/academyos/composition/types";

/** Deterministic sequential IDs for tests. */
export function createTestIdGenerator(start = 1): AcademyIdGenerator & {
  reset(next?: number): void;
} {
  let seq = start;
  return {
    next(prefix: string) {
      const id = `${prefix}_test_${seq}`;
      seq += 1;
      return id;
    },
    reset(next = 1) {
      seq = next;
    },
  };
}
