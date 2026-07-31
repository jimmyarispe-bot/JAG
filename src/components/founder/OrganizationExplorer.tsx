import Link from "next/link";
import type { FounderNavNode } from "@/lib/platform/founder/types";

type OrganizationExplorerProps = {
  navigation: FounderNavNode[];
};

function NavTree({ nodes, depth = 0 }: { nodes: FounderNavNode[]; depth?: number }) {
  return (
    <ul className={depth === 0 ? "space-y-2" : "mt-2 space-y-1 border-l border-slate-200 pl-3"}>
      {nodes.map((node) => (
        <li key={node.id}>
          <Link
            href={node.href}
            className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-brand-700"
          >
            {node.label}
          </Link>
          {node.children && node.children.length > 0 ? (
            <NavTree nodes={node.children} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Platform → Applications → Organizations drill-down from context.navigation. */
export function OrganizationExplorer({ navigation }: OrganizationExplorerProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="explorer-heading">
      <h2 id="explorer-heading" className="text-lg font-semibold text-slate-900">
        Navigation
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Platform → Application → Organization
      </p>
      {navigation.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Navigation unavailable.</p>
      ) : (
        <div className="mt-4">
          <NavTree nodes={navigation} />
        </div>
      )}
    </section>
  );
}
