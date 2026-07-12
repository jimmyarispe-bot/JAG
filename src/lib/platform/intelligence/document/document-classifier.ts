/**
 * Document classification and catalog intelligence.
 */

import type { DocumentClassifier as DocumentClassifierContract } from "@/lib/platform/intelligence/document/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  defaultCreateId,
  statusFromScore,
} from "@/lib/platform/intelligence/document/models";
import {
  DOCUMENT_COMPLIANCE_TAGS,
  DOCUMENT_TYPES,
  type DocumentBaseline,
  type DocumentCatalogResult,
  type DocumentClassificationResult,
  type DocumentComplianceTag,
  type DocumentParseResult,
  type DocumentRecord,
  type DocumentType,
} from "@/lib/platform/intelligence/document/types";

const LABELS: Record<DocumentType, string> = {
  policies: "Policies",
  procedures: "Procedures",
  sops: "SOPs",
  contracts: "Contracts",
  employment_agreements: "Employment Agreements",
  board_packets: "Board Packets",
  meeting_minutes: "Meeting Minutes",
  financial_statements: "Financial Statements",
  budgets: "Budgets",
  invoices: "Invoices",
  purchase_orders: "Purchase Orders",
  grant_applications: "Grant Applications",
  grant_awards: "Grant Awards",
  compliance_documents: "Compliance Documents",
  licenses: "Licenses",
  permits: "Permits",
  strategic_plans: "Strategic Plans",
  marketing_materials: "Marketing Materials",
  emails: "Emails",
  training_materials: "Training Materials",
  research: "Research",
};

export class DocumentClassifier implements DocumentClassifierContract {
  classify(input: {
    baseline: DocumentBaseline;
    parse: DocumentParseResult;
    now: Date;
  }): DocumentClassificationResult {
    void input.now;
    const accuracy = clamp(input.baseline.classificationAccuracy * 0.7 + input.parse.parseConfidence * 0.3);
    const byType = Object.fromEntries(
      DOCUMENT_TYPES.map((type) => [type, Math.max(1, Math.round(typeScore(type, input.baseline) / 20))])
    ) as Record<DocumentType, number>;
    const classifiedCount = Object.values(byType).reduce((sum, count) => sum + count, 0);

    return {
      classifiedCount,
      accuracy,
      byType,
      narrative: `Classification accuracy ${Math.round(accuracy)} across ${DOCUMENT_TYPES.length} document types.`,
    };
  }

  catalog(input: {
    baseline: DocumentBaseline;
    classification: DocumentClassificationResult;
    now: Date;
    createId: (prefix: string) => string;
  }): DocumentCatalogResult {
    const documents = DOCUMENT_TYPES.map((type, index) =>
      buildDocument(type, index, input.baseline, input.now, input.createId)
    );
    const byType = Object.fromEntries(DOCUMENT_TYPES.map((type) => [type, 1])) as Record<DocumentType, number>;
    const overallCoverage = clamp(
      documents.reduce((sum, doc) => sum + doc.confidence.value * 100, 0) / documents.length
    );
    const weakest = [...documents].sort((a, b) => a.confidence.value - b.confidence.value)[0]!;

    return {
      documents,
      byType,
      overallCoverage: clamp(overallCoverage * 0.65 + input.classification.accuracy * 0.35),
      weakestType: weakest.type,
      narrative: `Document catalog coverage ${Math.round(overallCoverage)}; weakest type ${LABELS[weakest.type]}.`,
    };
  }
}

function buildDocument(
  type: DocumentType,
  index: number,
  baseline: DocumentBaseline,
  now: Date,
  createId: (prefix: string) => string = defaultCreateId
): DocumentRecord {
  const score = typeScore(type, baseline);
  const id = createId(`doc-${type}`);
  const createdAt = new Date(now.getTime() - (180 + index * 9) * 86_400_000).toISOString();
  const updatedAt = new Date(now.getTime() - Math.round((100 - score) * 0.8) * 86_400_000).toISOString();
  const expiresAt = expiringType(type)
    ? new Date(now.getTime() + Math.round((score - 45) * 4) * 86_400_000).toISOString()
    : null;
  const expired = expiresAt != null && new Date(expiresAt).getTime() < now.getTime();
  const owner = ownerFor(type);
  const tags = complianceTagsFor(type);

  return {
    id,
    type,
    title: `${LABELS[type]} document set`,
    owner,
    status: expired ? "expired" : score >= 75 ? "approved" : score >= 58 ? "reviewed" : "classified",
    createdAt,
    updatedAt,
    expiresAt,
    version: `v${Math.max(1, Math.round(score / 28))}.0`,
    confidence: buildConfidence([
      { key: "type_score", label: "Type score", contribution: score / 100 },
      { key: "metadata", label: "Metadata", contribution: baseline.metadataCompleteness / 100 },
      { key: "classification", label: "Classification", contribution: baseline.classificationAccuracy / 100 },
    ]),
    summary: `${LABELS[type]} are ${statusFromScore(score)} with owner ${owner}.`,
    metadata: {
      type,
      owner,
      source: "document_intelligence",
      score: Math.round(score),
      lifecycleManaged: score >= 60,
    },
    entities: [],
    relationships: [],
    clauses: [],
    complianceTags: tags,
    riskFlags: [],
    knowledgeArtifactIds: [`draft-${type}`],
    narrative: `${LABELS[type]} classified at ${Math.round(score)} confidence.`,
    lenses: buildLenses({
      whatIsIt: `${LABELS[type]} corpus.`,
      whyItMatters: `${LABELS[type]} support governance, compliance, and execution decisions.`,
      whoOwnsIt: `${owner} owns stewardship.`,
      whenItExpires: expiresAt ?? "No explicit expiration detected.",
      knowledgeCreated: `Creates validated ${type} knowledge drafts.`,
      risksContained: `Risk pressure ${(baseline.riskPressure * 100).toFixed(0)}%.`,
      decisionsDependent: `Decision dependency density ${(baseline.decisionDependencyDensity * 100).toFixed(0)}%.`,
    }),
  };
}

function typeScore(type: DocumentType, b: DocumentBaseline): number {
  switch (type) {
    case "policies":
      return clamp(b.policyDensity);
    case "procedures":
    case "sops":
      return clamp(b.operationsProcessDensity);
    case "contracts":
      return clamp(b.contractDensity);
    case "employment_agreements":
    case "training_materials":
      return clamp(b.humanCapitalDocDensity);
    case "board_packets":
    case "meeting_minutes":
      return clamp(b.boardDocDensity);
    case "financial_statements":
    case "budgets":
    case "invoices":
    case "purchase_orders":
      return clamp(b.revenueDocDensity * 0.55 + b.executionScore * 0.45);
    case "grant_applications":
    case "grant_awards":
      return clamp(b.grantDensity);
    case "compliance_documents":
    case "licenses":
    case "permits":
      return clamp(b.complianceDensity);
    case "strategic_plans":
      return clamp(b.organizationHealthScore * 0.5 + b.executionScore * 0.5);
    case "marketing_materials":
    case "emails":
      return clamp(b.catalogCoverage * 0.5 + b.organizationHealthScore * 0.25 + b.executionScore * 0.25);
    case "research":
      return clamp(b.knowledgeContributionScore * 0.6 + b.catalogCoverage * 0.4);
  }
}

function ownerFor(type: DocumentType): string {
  if (type === "contracts" || type === "licenses" || type === "permits") return "legal";
  if (type.includes("grant")) return "funding";
  if (type === "employment_agreements" || type === "training_materials") return "human_capital";
  if (type === "board_packets" || type === "meeting_minutes" || type === "policies") return "governance";
  if (type === "financial_statements" || type === "budgets" || type === "invoices" || type === "purchase_orders") return "finance";
  if (type === "procedures" || type === "sops") return "operations";
  return "executive";
}

function expiringType(type: DocumentType): boolean {
  return ["contracts", "employment_agreements", "grant_awards", "licenses", "permits", "compliance_documents"].includes(type);
}

function complianceTagsFor(type: DocumentType): DocumentComplianceTag[] {
  const tags: DocumentComplianceTag[] = [];
  if (type === "policies") tags.push("policy");
  if (type === "contracts") tags.push("contractual");
  if (type === "employment_agreements" || type === "training_materials") tags.push("employment");
  if (type.includes("grant")) tags.push("grant");
  if (type === "financial_statements" || type === "budgets" || type === "invoices" || type === "purchase_orders") tags.push("financial");
  if (type === "board_packets" || type === "meeting_minutes") tags.push("board");
  if (type === "procedures" || type === "sops") tags.push("operational");
  if (type === "compliance_documents" || type === "licenses" || type === "permits") tags.push("regulatory");
  return tags.length ? tags : [DOCUMENT_COMPLIANCE_TAGS[0]];
}
