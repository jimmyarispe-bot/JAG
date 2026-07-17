import type { EconomicRepository as Contract } from "@/lib/platform/intelligence/economic/contracts";
import type { EconomicHistoryRecord, EconomicResult, GraphScope } from "@/lib/platform/intelligence/economic/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class EconomicRepositoryStore
  extends InMemoryResultHistoryRepository<EconomicResult, EconomicHistoryRecord, GraphScope>
  implements Contract {}

export { EconomicRepositoryStore as EconomicRepository };
