import type { PoliticalRepository as Contract } from "@/lib/platform/intelligence/political/contracts";
import type { PoliticalHistoryRecord, PoliticalResult, GraphScope } from "@/lib/platform/intelligence/political/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class PoliticalRepositoryStore
  extends InMemoryResultHistoryRepository<PoliticalResult, PoliticalHistoryRecord, GraphScope>
  implements Contract {}

export { PoliticalRepositoryStore as PoliticalRepository };
