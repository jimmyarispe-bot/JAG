import type { StakeholderRepository as Contract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { StakeholderHistoryRecord, StakeholderResult, GraphScope } from "@/lib/platform/intelligence/stakeholder/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class StakeholderRepositoryStore
  extends InMemoryResultHistoryRepository<StakeholderResult, StakeholderHistoryRecord, GraphScope>
  implements Contract {}

export { StakeholderRepositoryStore as StakeholderRepository };
