import type { ResilienceRepository } from "@/lib/platform/intelligence/resilience/contracts";
import type { ResilienceHistoryRecord, ResilienceResult, GraphScope } from "@/lib/platform/intelligence/resilience/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class ResilienceRepositoryStore
  extends InMemoryResultHistoryRepository<ResilienceResult, ResilienceHistoryRecord, GraphScope>
  implements ResilienceRepository {
  constructor() {
    super({ clearHistoryMode: "replace" });
  }
}
