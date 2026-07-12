/**
 * Document expiration monitoring intelligence.
 */

import type { DocumentExpirationIntelligence as DocumentExpirationIntelligenceContract } from "@/lib/platform/intelligence/document/contracts";
import { clamp } from "@/lib/platform/intelligence/document/models";
import type {
  DocumentBaseline,
  DocumentCatalogResult,
  DocumentExpirationSuite,
} from "@/lib/platform/intelligence/document/types";

export class DocumentExpirationIntelligence implements DocumentExpirationIntelligenceContract {
  monitor(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    now: Date;
  }): DocumentExpirationSuite {
    const soonWindow = input.now.getTime() + 90 * 86_400_000;
    const expiringSoon = input.catalog.documents.filter((document) => {
      if (!document.expiresAt) return false;
      const time = new Date(document.expiresAt).getTime();
      return time >= input.now.getTime() && time <= soonWindow;
    });
    const expired = input.catalog.documents.filter(
      (document) => document.expiresAt !== null && new Date(document.expiresAt).getTime() < input.now.getTime()
    );
    const monitoringScore = clamp(
      100 - input.baseline.expirationRisk * 55 - expired.length * 8 - expiringSoon.length * 3
    );
    const nextExpiration =
      input.catalog.documents
        .map((document) => document.expiresAt)
        .filter((date): date is string => date !== null)
        .sort()[0] ?? null;

    return {
      expiringSoon,
      expired,
      monitoringScore,
      nextExpiration,
      narrative: `Expiration monitoring ${Math.round(monitoringScore)} with ${expired.length} expired and ${expiringSoon.length} expiring soon.`,
    };
  }
}
