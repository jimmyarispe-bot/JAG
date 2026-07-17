/** In-memory Funding Intelligence repository. */

import type { FundingRepository as Contract } from "@/lib/platform/intelligence/funding/contracts";
import type { FundingHistoryRecord, FundingResult, GraphScope } from "@/lib/platform/intelligence/funding/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class FundingRepositoryStore
  extends InMemoryResultHistoryRepository<FundingResult, FundingHistoryRecord, GraphScope>
  implements Contract {}

export { FundingRepositoryStore as FundingRepository };
