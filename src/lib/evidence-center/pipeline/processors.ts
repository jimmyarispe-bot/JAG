/**
 * Pluggable Evidence Processor architecture.
 * UI never invokes these — only the pipeline service does.
 * Modules are placeholders (no OCR / AI / extraction).
 */

import type { ProcessingStage } from "@/lib/evidence-center/pipeline/types";

export type ProcessorContext = {
  readonly jobId: string;
  readonly evidenceId: string;
  readonly organizationId: string;
  readonly stage: ProcessingStage;
};

export type ProcessorResult =
  | { readonly ok: true; readonly eventName: string; readonly message: string }
  | { readonly ok: false; readonly error: string };

export type EvidenceProcessorModule = {
  readonly id: string;
  readonly stage: ProcessingStage;
  readonly run: (ctx: ProcessorContext) => ProcessorResult;
};

function ok(eventName: string, message: string): ProcessorResult {
  return { ok: true, eventName, message };
}

/** Validation Module — file/metadata checks already done at upload; placeholder pass. */
export const validationModule: EvidenceProcessorModule = {
  id: "validation",
  stage: "File Validation",
  run: () => ok("Validation Complete", "File validation placeholder passed."),
};

/** Virus Scan Module — placeholder only. */
export const virusScanModule: EvidenceProcessorModule = {
  id: "virus_scan",
  stage: "Virus Scan",
  run: () =>
    ok("Virus Scan Complete", "Virus scan placeholder — not executed."),
};

/** Metadata Validation Module */
export const metadataValidationModule: EvidenceProcessorModule = {
  id: "metadata_validation",
  stage: "Metadata Validation",
  run: () =>
    ok("Metadata Validation Complete", "Catalog metadata validated."),
};

/** Classification Module — no AI. */
export const classificationModule: EvidenceProcessorModule = {
  id: "classification",
  stage: "Classification",
  run: () =>
    ok(
      "Classification Complete",
      "Classification placeholder — domain/type already cataloged."
    ),
};

/** Index Module */
export const indexModule: EvidenceProcessorModule = {
  id: "index",
  stage: "Catalog Index",
  run: () => ok("Catalog Index Complete", "Evidence indexed in catalog."),
};

/** OCR Module — reserved, not registered in default pipeline run. */
export const ocrModulePlaceholder: EvidenceProcessorModule = {
  id: "ocr",
  stage: "Classification",
  run: () => ok("OCR Skipped", "OCR not implemented this sprint."),
};

/** Extraction Module — reserved. */
export const extractionModulePlaceholder: EvidenceProcessorModule = {
  id: "extraction",
  stage: "Classification",
  run: () => ok("Extraction Skipped", "Extraction not implemented this sprint."),
};

/** Executive Intelligence Module — reserved. */
export const executiveIntelligenceModulePlaceholder: EvidenceProcessorModule = {
  id: "executive_intelligence",
  stage: "Ready for Intelligence",
  run: () =>
    ok(
      "Ready for Intelligence",
      "Evidence marked ready — EI integration not implemented."
    ),
};

/** Default ordered processor chain for orchestration. */
export const DEFAULT_PROCESSOR_CHAIN: readonly EvidenceProcessorModule[] =
  Object.freeze([
    validationModule,
    virusScanModule,
    metadataValidationModule,
    classificationModule,
    indexModule,
    executiveIntelligenceModulePlaceholder,
  ]);
