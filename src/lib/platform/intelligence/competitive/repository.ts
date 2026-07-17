import type { CompetitiveRepository as Contract } from "@/lib/platform/intelligence/competitive/contracts";
import type { CompetitiveHistoryRecord, CompetitiveResult, GraphScope } from "@/lib/platform/intelligence/competitive/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class CompetitiveRepositoryStore
  extends InMemoryResultHistoryRepository<CompetitiveResult, CompetitiveHistoryRecord, GraphScope>
  implements Contract {}

export { CompetitiveRepositoryStore as CompetitiveRepository };
