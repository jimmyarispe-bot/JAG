import type { EnvironmentalRepository as Contract } from "@/lib/platform/intelligence/environmental/contracts";
import type { EnvironmentalHistoryRecord, EnvironmentalResult, GraphScope } from "@/lib/platform/intelligence/environmental/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class EnvironmentalRepositoryStore
  extends InMemoryResultHistoryRepository<EnvironmentalResult, EnvironmentalHistoryRecord, GraphScope>
  implements Contract {}

export { EnvironmentalRepositoryStore as EnvironmentalRepository };
