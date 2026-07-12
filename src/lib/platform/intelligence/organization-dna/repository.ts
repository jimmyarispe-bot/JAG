/**
 * OrganizationDnaRepository — in-memory store (Sprint 030).
 */

import type { OrganizationDnaRepository as OrganizationDnaRepositoryContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderArtifact,
  CompanyBuilderArtifactKind,
  GraphScope,
  OrganizationDNA,
  OrganizationDnaHistoryRecord,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationDnaRepositoryStore
  implements OrganizationDnaRepositoryContract
{
  private readonly dnaById = new Map<string, OrganizationDNA>();
  private readonly artifactsById = new Map<string, CompanyBuilderArtifact>();
  private readonly history: OrganizationDnaHistoryRecord[] = [];

  save(dna: OrganizationDNA): OrganizationDNA {
    this.dnaById.set(dna.id, dna);
    return dna;
  }

  get(dnaId: string): OrganizationDNA | null {
    return this.dnaById.get(dnaId) ?? null;
  }

  list(scope?: Partial<GraphScope>): OrganizationDNA[] {
    const all = [...this.dnaById.values()];
    if (!scope) return all;
    return all.filter((dna) => this.matchesScope(dna.scope, scope));
  }

  remove(dnaId: string): boolean {
    return this.dnaById.delete(dnaId);
  }

  saveArtifact(artifact: CompanyBuilderArtifact): CompanyBuilderArtifact {
    this.artifactsById.set(artifact.id, artifact);
    return artifact;
  }

  listArtifacts(
    kinds?: CompanyBuilderArtifactKind[]
  ): CompanyBuilderArtifact[] {
    const all = [...this.artifactsById.values()];
    if (!kinds || kinds.length === 0) return all;
    const set = new Set(kinds);
    return all.filter((a) => set.has(a.kind));
  }

  saveHistory(
    record: OrganizationDnaHistoryRecord
  ): OrganizationDnaHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): OrganizationDnaHistoryRecord[] {
    if (!scope) return [...this.history];
    return this.history.filter((h) => this.matchesScope(h.scope, scope));
  }

  clear(): void {
    this.dnaById.clear();
    this.artifactsById.clear();
    this.history.length = 0;
  }

  private matchesScope(
    scope: GraphScope,
    filter: Partial<GraphScope>
  ): boolean {
    if (
      filter.organizationId != null &&
      scope.organizationId !== filter.organizationId
    ) {
      return false;
    }
    if (filter.schoolId != null && scope.schoolId !== filter.schoolId) {
      return false;
    }
    return true;
  }
}

export { OrganizationDnaRepositoryStore as OrganizationDnaRepository };
