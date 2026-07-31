import type {
  SearchDocument,
  SearchProvider,
} from "@/applications/academyos/infrastructure/search/types";

export function createMemorySearchProvider(): SearchProvider {
  const docs = new Map<string, SearchDocument>();
  const key = (collection: string, id: string) => `${collection}::${id}`;

  return {
    id: "memory",
    async index(document) {
      docs.set(key(document.collection, document.id), { ...document });
    },
    async remove(collection, id) {
      docs.delete(key(collection, id));
    },
    async query(input) {
      const needle = input.text.trim().toLowerCase();
      if (!needle) return [];
      const limit = input.limit ?? 20;
      return [...docs.values()]
        .filter((doc) =>
          input.collection ? doc.collection === input.collection : true
        )
        .filter((doc) => {
          const hay = `${doc.title} ${doc.body ?? ""}`.toLowerCase();
          return hay.includes(needle);
        })
        .slice(0, limit)
        .map((doc, index) => ({
          id: doc.id,
          collection: doc.collection,
          score: 1 - index * 0.01,
          title: doc.title,
        }));
    },
  };
}
