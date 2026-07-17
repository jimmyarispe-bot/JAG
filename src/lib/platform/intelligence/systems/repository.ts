import type { SystemsRepository } from "@/lib/platform/intelligence/systems/contracts";
import type { SystemsHistoryRecord, SystemsResult, GraphScope } from "@/lib/platform/intelligence/systems/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class SystemsRepositoryStore
  extends InMemoryResultHistoryRepository<SystemsResult, SystemsHistoryRecord, GraphScope>
  implements SystemsRepository {
  constructor() {
    super({ clearHistoryMode: "replace" });
  }
}
