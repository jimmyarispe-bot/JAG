import { getAllGraphProviders } from "@/lib/platform/intelligence-graph/registry/node-registry";
import type {
  GraphProviderContext,
  GraphProviderKey,
  GraphSearchQuery,
  GraphSearchResult,
} from "@/lib/platform/intelligence-graph/types";
import { dedupeGraphNodes, normalizeFilterValues } from "@/lib/platform/intelligence-graph/utils";

/** Graph Search API — search nodes across registered platform graph providers. */
export async function searchGraph(
  ctx: GraphProviderContext,
  query: GraphSearchQuery
): Promise<GraphSearchResult> {
  const limit = query.limit ?? 50;
  const providerKeys = normalizeFilterValues(query.providerKeys);

  const providers = providerKeys
    ? getAllGraphProviders().filter((provider) => providerKeys.includes(provider.providerKey))
    : getAllGraphProviders();

  const resultSets = await Promise.all(
    providers
      .filter((provider) => typeof provider.searchNodes === "function")
      .map((provider) => provider.searchNodes!(ctx, { ...query, limit }))
  );

  const nodes = dedupeGraphNodes(resultSets.flat()).slice(0, limit);

  return {
    query: query.query,
    nodes,
    matchCount: nodes.length,
    truncated: resultSets.flat().length > limit,
  };
}

/** Search graph nodes for a specific provider key. */
export async function searchGraphByProvider(
  ctx: GraphProviderContext,
  providerKey: GraphProviderKey,
  query: Omit<GraphSearchQuery, "providerKeys">
): Promise<GraphSearchResult> {
  return searchGraph(ctx, { ...query, providerKeys: providerKey });
}
