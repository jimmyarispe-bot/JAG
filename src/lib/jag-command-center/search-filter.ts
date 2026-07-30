/** Pure search helpers — safe for client components. */

export type JagSearchItemKind =
  | "navigation"
  | "decision"
  | "briefing"
  | "organization"
  | "capability_pack"
  | "capability"
  | "domain"
  | "contributor"
  | "knowledge"
  | "policy"
  | "reasoning"
  | "evidence"
  | "goal";

export type JagSearchItem = {
  readonly id: string;
  readonly kind: JagSearchItemKind;
  readonly title: string;
  readonly subtitle: string;
  readonly href: string;
};

export function filterJagSearchCatalog(
  catalog: readonly JagSearchItem[],
  query: string,
  limit = 24
): readonly JagSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return catalog.filter((i) => i.kind === "navigation").slice(0, limit);
  }
  return catalog
    .filter((item) => {
      const hay = `${item.title} ${item.subtitle} ${item.kind}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);
}
