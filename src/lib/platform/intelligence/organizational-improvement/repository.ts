/** In-memory Organizational Improvement repository (Sprint 036). */

import type { ImprovementRepository as Contract } from "@/lib/platform/intelligence/organizational-improvement/contracts";
import type {
  GraphScope,
  ImprovementHistoryRecord,
  ImprovementResult,
} from "@/lib/platform/intelligence/organizational-improvement/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class ImprovementRepositoryStore
  extends InMemoryResultHistoryRepository<ImprovementResult, ImprovementHistoryRecord, GraphScope>
  implements Contract {}

export { ImprovementRepositoryStore as ImprovementRepository };
