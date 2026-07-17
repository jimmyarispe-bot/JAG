import type { ImpactRepository as Contract } from "@/lib/platform/intelligence/impact/contracts";
import type { GraphScope, ImpactHistoryRecord, ImpactResult } from "@/lib/platform/intelligence/impact/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class ImpactRepositoryStore
  extends InMemoryResultHistoryRepository<ImpactResult, ImpactHistoryRecord, GraphScope>
  implements Contract {}

export { ImpactRepositoryStore as ImpactRepository };
