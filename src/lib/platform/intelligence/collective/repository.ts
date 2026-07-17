import type { CollectiveRepository } from "@/lib/platform/intelligence/collective/contracts";
import type { CollectiveHistoryRecord, CollectiveResult, GraphScope } from "@/lib/platform/intelligence/collective/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class CollectiveRepositoryStore
  extends InMemoryResultHistoryRepository<CollectiveResult, CollectiveHistoryRecord, GraphScope>
  implements CollectiveRepository {
  constructor() {
    super({ clearHistoryMode: "replace" });
  }
}
