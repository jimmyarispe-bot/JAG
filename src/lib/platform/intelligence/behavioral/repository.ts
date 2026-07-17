import type { BehavioralRepository as Contract } from "@/lib/platform/intelligence/behavioral/contracts";
import type { BehavioralHistoryRecord, BehavioralResult, GraphScope } from "@/lib/platform/intelligence/behavioral/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class BehavioralRepositoryStore
  extends InMemoryResultHistoryRepository<BehavioralResult, BehavioralHistoryRecord, GraphScope>
  implements Contract {}

export { BehavioralRepositoryStore as BehavioralRepository };
