/**
 * Document Intelligence — repository.
 */

import type { DocumentRepository as DocumentRepositoryContract } from "@/lib/platform/intelligence/document/contracts";
import type {
  DocumentHistoryRecord,
  DocumentResult,
  GraphScope,
} from "@/lib/platform/intelligence/document/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class DocumentRepositoryStore
  extends InMemoryResultHistoryRepository<DocumentResult, DocumentHistoryRecord, GraphScope>
  implements DocumentRepositoryContract {}

export { DocumentRepositoryStore as DocumentRepository };
