/**
 * Document parser readiness intelligence.
 */

import type { DocumentParser as DocumentParserContract } from "@/lib/platform/intelligence/document/contracts";
import { clamp } from "@/lib/platform/intelligence/document/models";
import type { DocumentBaseline, DocumentParseResult } from "@/lib/platform/intelligence/document/types";

export class DocumentParser implements DocumentParserContract {
  parse(input: { baseline: DocumentBaseline; now: Date }): DocumentParseResult {
    void input.now;
    const ocrReady = clamp(input.baseline.ocrReadiness);
    const parsedCount = Math.max(1, Math.round(input.baseline.documentCount * (ocrReady / 100)));
    const parseConfidence = clamp(
      ocrReady * 0.45 +
        input.baseline.metadataCompleteness * 0.25 +
        input.baseline.catalogCoverage * 0.2 +
        (100 - input.baseline.expiredRatio * 100) * 0.1
    );

    return {
      ocrReady,
      parsedCount,
      parseConfidence,
      narrative: `Document parse readiness ${Math.round(parseConfidence)} with ${parsedCount} parsed records and OCR readiness ${Math.round(ocrReady)}.`,
    };
  }
}
