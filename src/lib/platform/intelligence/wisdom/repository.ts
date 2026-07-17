import type { WisdomRepository } from "@/lib/platform/intelligence/wisdom/contracts";
import type { WisdomHistoryRecord, WisdomResult, GraphScope } from "@/lib/platform/intelligence/wisdom/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class WisdomRepositoryStore
  extends InMemoryResultHistoryRepository<WisdomResult, WisdomHistoryRecord, GraphScope>
  implements WisdomRepository {
  constructor() {
    super({ clearHistoryMode: "replace" });
  }
}
