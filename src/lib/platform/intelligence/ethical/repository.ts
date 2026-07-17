import type { EthicalRepository } from "@/lib/platform/intelligence/ethical/contracts";
import type { EthicalHistoryRecord, EthicalResult, GraphScope } from "@/lib/platform/intelligence/ethical/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class EthicalRepositoryStore
  extends InMemoryResultHistoryRepository<EthicalResult, EthicalHistoryRecord, GraphScope>
  implements EthicalRepository {
  constructor() {
    super({ clearHistoryMode: "replace" });
  }
}
