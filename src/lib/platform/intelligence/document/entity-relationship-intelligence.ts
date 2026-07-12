/**
 * Document entity and relationship intelligence.
 */

import type { DocumentEntityRelationshipIntelligence as DocumentEntityRelationshipIntelligenceContract } from "@/lib/platform/intelligence/document/contracts";
import { clamp, defaultCreateId } from "@/lib/platform/intelligence/document/models";
import {
  DOCUMENT_RELATION_KINDS,
  type DocumentBaseline,
  type DocumentCatalogResult,
  type DocumentEntityRecord,
  type DocumentEntitySuite,
  type DocumentRelationshipRecord,
  type DocumentRelationshipSuite,
  type DocumentRelationKind,
} from "@/lib/platform/intelligence/document/types";

export class DocumentEntityRelationshipIntelligence
  implements DocumentEntityRelationshipIntelligenceContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  extractEntities(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    now: Date;
  }): DocumentEntitySuite {
    void input.now;
    const entities = input.catalog.documents.flatMap((document, index): DocumentEntityRecord[] => [
      {
        id: this.createId("doc-entity"),
        documentId: document.id,
        label: document.owner,
        kind: "organization",
        confidence: clamp(input.baseline.entityCoverage + index % 5) / 100,
      },
      {
        id: this.createId("doc-entity"),
        documentId: document.id,
        label: document.type,
        kind: "topic",
        confidence: clamp(input.baseline.classificationAccuracy) / 100,
      },
      ...(document.expiresAt
        ? [
            {
              id: this.createId("doc-entity"),
              documentId: document.id,
              label: document.expiresAt,
              kind: "date" as const,
              confidence: clamp(input.baseline.metadataCompleteness) / 100,
            },
          ]
        : []),
    ]);
    const coverageScore = clamp(input.baseline.entityCoverage * 0.75 + input.catalog.overallCoverage * 0.25);

    return {
      entities,
      coverageScore,
      narrative: `Entity extraction coverage ${Math.round(coverageScore)} across ${entities.length} entities.`,
    };
  }

  extractRelationships(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    entities: DocumentEntitySuite;
    now: Date;
  }): DocumentRelationshipSuite {
    void input.now;
    const documents = input.catalog.documents;
    const relationships: DocumentRelationshipRecord[] = documents.slice(1).map((document, index) => {
      const previous = documents[index]!;
      const kind = relationKindFor(index, document.owner === previous.owner);
      return {
        id: this.createId("doc-rel"),
        fromDocumentId: document.id,
        toDocumentId: previous.id,
        kind,
        strength: clamp(input.baseline.relationshipDensity + input.entities.coverageScore * 0.15) / 100,
        narrative: `${document.title} ${kind} ${previous.title}.`,
      };
    });
    const densityScore = clamp(
      input.baseline.relationshipDensity * 0.75 + relationships.length * 1.5 + input.entities.coverageScore * 0.1
    );
    const hottestKind = hottestRelation(relationships);

    return {
      relationships,
      densityScore,
      hottestKind,
      narrative: `Relationship density ${Math.round(densityScore)}; hottest relation ${hottestKind}.`,
    };
  }
}

function relationKindFor(index: number, sameOwner: boolean): DocumentRelationKind {
  if (sameOwner) return "owned_by";
  return DOCUMENT_RELATION_KINDS[index % DOCUMENT_RELATION_KINDS.length];
}

function hottestRelation(relationships: DocumentRelationshipRecord[]): DocumentRelationKind {
  const counts = new Map<DocumentRelationKind, number>();
  for (const relationship of relationships) {
    counts.set(relationship.kind, (counts.get(relationship.kind) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "related_to";
}
