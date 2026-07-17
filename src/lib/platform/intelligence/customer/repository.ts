/**
 * Customer Intelligence — repository (Sprint 039).
 */

import type { CustomerRepository as CustomerRepositoryContract } from "@/lib/platform/intelligence/customer/contracts";
import type {
  CustomerHistoryRecord,
  CustomerResult,
  GraphScope,
} from "@/lib/platform/intelligence/customer/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

/**
 * In-memory customer result + history store.
 */
export class CustomerRepositoryStore
  extends InMemoryResultHistoryRepository<CustomerResult, CustomerHistoryRecord, GraphScope>
  implements CustomerRepositoryContract {}

/** Alias matching Sprint naming. */
export { CustomerRepositoryStore as CustomerRepository };
