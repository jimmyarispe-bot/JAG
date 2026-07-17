import type { EcosystemRepository } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { EcosystemHistoryRecord, EcosystemResult, GraphScope } from "@/lib/platform/intelligence/ecosystem/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class EcosystemRepositoryStore
  extends InMemoryResultHistoryRepository<EcosystemResult, EcosystemHistoryRecord, GraphScope>
  implements EcosystemRepository {
  constructor() {
    super({ clearHistoryMode: "replace" });
  }
}
