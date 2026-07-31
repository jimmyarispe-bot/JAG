import type { SearchProvider } from "@/applications/academyos/infrastructure/search/types";

/** Stub search — future backends plug in without application changes. */
export function createStubSearchProvider(): SearchProvider {
  return {
    id: "stub",
    async index() {
      /* no-op */
    },
    async remove() {
      /* no-op */
    },
    async query() {
      return [];
    },
  };
}
