/**
 * Knowledge Intelligence — repository (Sprint 040).
 */

import type { KnowledgeRepository as KnowledgeRepositoryContract } from "@/lib/platform/intelligence/knowledge/contracts";
import type {
  GraphScope,
  KnowledgeHistoryRecord,
  KnowledgeResult,
} from "@/lib/platform/intelligence/knowledge/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

/**
 * In-memory knowledge result + history store.
 */
export class KnowledgeRepositoryStore
  extends InMemoryResultHistoryRepository<KnowledgeResult, KnowledgeHistoryRecord, GraphScope>
  implements KnowledgeRepositoryContract {}

/** Alias matching Sprint naming. */
export { KnowledgeRepositoryStore as KnowledgeRepository };
