/**
 * Reusable evidence builder for Education cognitive contributors.
 */

import type { CognitiveEvidenceRef } from "@/lib/jag/runtime";

export type EducationEvidenceSeverity = "info" | "warning" | "blocking";

export interface EducationEvidenceItem {
  code: string;
  id: string;
  summary: string;
  severity: EducationEvidenceSeverity;
  ref: CognitiveEvidenceRef;
}

export interface EducationEvidenceBuildResult {
  items: EducationEvidenceItem[];
  refs: CognitiveEvidenceRef[];
  blockingIssues: string[];
  warnings: string[];
  findings: string[];
}

export class EducationEvidenceBuilder {
  private readonly items: EducationEvidenceItem[] = [];

  constructor(
    private readonly options: {
      source: string;
      scopeId: string;
      now?: string;
    }
  ) {}

  addFinding(
    code: string,
    summary: string,
    extra?: Readonly<Record<string, unknown>>
  ): this {
    return this.push(code, summary, "info", extra);
  }

  addWarning(
    code: string,
    summary: string,
    extra?: Readonly<Record<string, unknown>>
  ): this {
    return this.push(code, summary, "warning", extra);
  }

  addBlockingIssue(
    code: string,
    summary: string,
    extra?: Readonly<Record<string, unknown>>
  ): this {
    return this.push(code, summary, "blocking", extra);
  }

  addSupportingEvidence(
    code: string,
    summary: string,
    extra?: Readonly<Record<string, unknown>>
  ): this {
    return this.push(code, summary, "info", extra);
  }

  build(): EducationEvidenceBuildResult {
    const items = [...this.items];
    return {
      items,
      refs: items.map((i) => i.ref),
      blockingIssues: items
        .filter((i) => i.severity === "blocking")
        .map((i) => i.summary),
      warnings: items
        .filter((i) => i.severity === "warning")
        .map((i) => i.summary),
      findings: items
        .filter((i) => i.severity === "info")
        .map((i) => i.summary),
    };
  }

  private push(
    code: string,
    summary: string,
    severity: EducationEvidenceSeverity,
    extra?: Readonly<Record<string, unknown>>
  ): this {
    const suffix =
      typeof extra?.suffix === "string" ? `:${extra.suffix}` : "";
    const id = `${this.options.scopeId}:${code}${suffix}`;
    const retrievedAt = this.options.now ?? new Date().toISOString();
    this.items.push({
      code,
      id,
      summary,
      severity,
      ref: {
        source: this.options.source,
        id,
        retrievedAt,
        attributes: { code, summary, severity, ...extra },
      },
    });
    return this;
  }
}

export function createEducationEvidenceBuilder(options: {
  source: string;
  scopeId: string;
  now?: string;
}): EducationEvidenceBuilder {
  return new EducationEvidenceBuilder(options);
}
