/**
 * Innovation Intelligence — repository.
 */

import type { InnovationRepository as InnovationRepositoryContract } from "@/lib/platform/intelligence/innovation/contracts";
import type {
  GraphScope,
  InnovationHistoryRecord,
  InnovationResult,
} from "@/lib/platform/intelligence/innovation/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class InnovationRepositoryStore
  extends InMemoryResultHistoryRepository<InnovationResult, InnovationHistoryRecord, GraphScope>
  implements InnovationRepositoryContract {}

export { InnovationRepositoryStore as InnovationRepository };
