import type { ReputationRepository as Contract } from "@/lib/platform/intelligence/reputation/contracts";
import type { ReputationHistoryRecord, ReputationResult, GraphScope } from "@/lib/platform/intelligence/reputation/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class ReputationRepositoryStore
  extends InMemoryResultHistoryRepository<ReputationResult, ReputationHistoryRecord, GraphScope>
  implements Contract {}

export { ReputationRepositoryStore as ReputationRepository };
