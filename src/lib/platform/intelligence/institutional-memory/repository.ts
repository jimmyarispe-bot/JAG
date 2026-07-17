import type { InstitutionalMemoryRepository } from "@/lib/platform/intelligence/institutional-memory/contracts";
import type { InstitutionalMemoryHistoryRecord, InstitutionalMemoryResult, GraphScope } from "@/lib/platform/intelligence/institutional-memory/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class InstitutionalMemoryRepositoryStore
  extends InMemoryResultHistoryRepository<InstitutionalMemoryResult, InstitutionalMemoryHistoryRecord, GraphScope>
  implements InstitutionalMemoryRepository {
  constructor() {
    super({ clearHistoryMode: "replace" });
  }
}
