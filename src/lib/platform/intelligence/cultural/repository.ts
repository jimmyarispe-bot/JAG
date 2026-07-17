import type { CulturalRepository } from "@/lib/platform/intelligence/cultural/contracts";
import type { CulturalHistoryRecord, CulturalResult, GraphScope } from "@/lib/platform/intelligence/cultural/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class CulturalRepositoryStore
  extends InMemoryResultHistoryRepository<CulturalResult, CulturalHistoryRecord, GraphScope>
  implements CulturalRepository {
  constructor() {
    super({ clearHistoryMode: "replace" });
  }
}
