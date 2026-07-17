/** In-memory Opportunity Intelligence repository (Sprint 035). */

import type { OpportunityRepository as Contract } from "@/lib/platform/intelligence/opportunity/contracts";
import type { GraphScope, OpportunityHistoryRecord, OpportunityResult } from "@/lib/platform/intelligence/opportunity/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class OpportunityRepositoryStore
  extends InMemoryResultHistoryRepository<OpportunityResult, OpportunityHistoryRecord, GraphScope>
  implements Contract {}

export { OpportunityRepositoryStore as OpportunityRepository };
