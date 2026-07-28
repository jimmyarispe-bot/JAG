/**
 * Platform Sprint P-014 — JAG Knowledge™
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createKnowledgeEngine,
  DOCUMENT_TYPE_PRESETS,
  KNOWLEDGE_GUARDS,
  KNOWLEDGE_SINKS,
  KNOWLEDGE_VERSION,
  resetKnowledgeStoreForTests,
} from "@knowledge";
import {
  createChiefFinancialOfficerEngine,
  resetCfoStoreForTests,
} from "@cfo";
import { createFinanceEngine, resetFinanceStoreForTests } from "@finance";

const root = join(__dirname, "../../../..");
const docs = join(root, "docs/platform/knowledge");

afterEach(() => {
  resetKnowledgeStoreForTests();
  resetFinanceStoreForTests();
  resetCfoStoreForTests();
});

describe("P-014 JAG Knowledge", () => {
  it("guards: canonical owner, no duplicates, education interpretation in P-015", () => {
    expect(KNOWLEDGE_GUARDS.canonicalDocumentOwner).toBe(true);
    expect(KNOWLEDGE_GUARDS.duplicatesDocumentModels).toBe(false);
    expect(KNOWLEDGE_GUARDS.duplicatesEvidenceSystems).toBe(false);
    expect(KNOWLEDGE_GUARDS.educationInterpretationInP015).toBe(true);
    expect(KNOWLEDGE_GUARDS.documentsImmutableVersions).toBe(true);
    expect(KNOWLEDGE_SINKS.digitalTwin).toBe(true);
    expect(KNOWLEDGE_VERSION).toBe("1.0.0");
    expect(DOCUMENT_TYPE_PRESETS.length).toBeGreaterThan(40);
  });

  it("ships documentation", () => {
    for (const f of [
      "01_ARCHITECTURE.md",
      "02_DOCUMENT_MODEL.md",
      "03_KNOWLEDGE_GRAPH.md",
      "04_EVIDENCE_ENGINE.md",
      "05_SEARCH.md",
      "06_API.md",
    ]) {
      expect(existsSync(join(docs, f))).toBe(true);
    }
  });

  it("uploads, versions immutably, check-out/in, archive/restore, retention", () => {
    const k = createKnowledgeEngine();
    const { document, version } = k.uploadDocument({
      organizationId: "org.k",
      userId: "u-1",
      title: "Policy Draft",
      content: "Board policy on retention.",
      typeKey: "policy",
      tags: ["board"],
    });
    expect(version.immutable).toBe(true);
    expect(version.versionNumber).toBe(1);

    const v2 = k.createVersion({
      organizationId: "org.k",
      userId: "u-1",
      documentId: document.id,
      content: "Board policy on retention. Revised.",
      changeNote: "Revise",
    });
    expect(v2.versionNumber).toBe(2);
    expect(k.listVersions(document.id)).toHaveLength(2);

    const out = k.checkOutDocument({
      organizationId: "org.k",
      userId: "u-1",
      documentId: document.id,
    });
    expect(out.status).toBe("checked_out");
    const inn = k.checkInDocument({
      organizationId: "org.k",
      userId: "u-1",
      documentId: document.id,
      content: "Checked in body",
    });
    expect(inn.status).toBe("active");
    expect(k.listVersions(document.id).length).toBeGreaterThanOrEqual(3);

    const archived = k.archiveDocument({
      organizationId: "org.k",
      documentId: document.id,
    });
    expect(archived.status).toBe("archived");
    expect(
      k.restoreDocument({ organizationId: "org.k", documentId: document.id })
        .status
    ).toBe("active");

    const policy = k.createRetentionPolicy({
      organizationId: "org.k",
      name: "7yr",
      retainDays: 2555,
      action: "immutable_archive",
    });
    const retained = k.applyRetention({
      organizationId: "org.k",
      documentId: document.id,
      policyId: policy.id,
      userId: "u-1",
    });
    expect(retained.status).toBe("immutable_archive");
  });

  it("runs OCR, classification, entity extraction, evidence never disappears", () => {
    const k = createKnowledgeEngine();
    const { document } = k.uploadDocument({
      organizationId: "org.ocr",
      userId: "u-1",
      title: "Student Assessment",
      content:
        "[scanned] Student: Jane Doe\nTeacher: Mr Smith\nDate: 2026-07-01\nGoal: Improve reading\nDiagnosis: ADHD\nAccommodation: Extra time",
      mimeType: "application/pdf",
      typeKey: "general",
    });
    const ocr = k.runOcr({
      organizationId: "org.ocr",
      userId: "u-1",
      documentId: document.id,
    });
    expect(ocr.handwritingHookReady).toBe(true);
    expect(ocr.multilingualHookReady).toBe(true);
    expect(ocr.text.length).toBeGreaterThan(0);

    const classified = k.classifyDocument({
      organizationId: "org.ocr",
      userId: "u-1",
      documentId: document.id,
    });
    expect(classified.typeKey).toBe("assessment");

    const entities = k.extractEntities({
      organizationId: "org.ocr",
      userId: "u-1",
      documentId: document.id,
    });
    expect(entities.length).toBeGreaterThan(0);
    expect(entities.some((e) => e.kind === "diagnosis")).toBe(true);

    const facts = k.listEvidenceFacts("org.ocr", document.id);
    expect(facts.length).toBeGreaterThan(0);
    expect(facts.every((f) => f.tombstoned === false)).toBe(true);
  });

  it("builds knowledge graph, timeline, semantic search, evidence-backed summary", () => {
    const k = createKnowledgeEngine();
    const ingested = k.ingest({
      organizationId: "org.graph",
      userId: "u-1",
      title: "Invoice 42",
      content: "Invoice for Vendor ACME Corp\nDate: 2026-07-15\nAmount due",
      typeKey: "invoice",
      tags: ["finance"],
    });
    expect(ingested.index.vector.length).toBe(32);

    const graph = k.queryGraph("org.graph");
    expect(graph.nodes.some((n) => n.kind === "document")).toBe(true);

    const person = k.upsertNode({
      organizationId: "org.graph",
      kind: "vendor",
      label: "ACME Corp",
    });
    const docNode = graph.nodes.find((n) => n.kind === "document")!;
    const facts = k.listEvidenceFacts("org.graph", ingested.document.id);
    k.relate({
      organizationId: "org.graph",
      fromNodeId: docNode.id,
      toNodeId: person.id,
      relationship: "mentions",
      evidenceFactIds: facts.slice(0, 1).map((f) => f.id),
    });

    const timeline = k.buildTimeline({ organizationId: "org.graph" });
    expect(timeline.length).toBeGreaterThan(0);

    const hits = k.search({
      organizationId: "org.graph",
      query: "invoice vendor",
      mode: "hybrid",
    });
    expect(hits.length).toBeGreaterThan(0);

    const summary = k.summarizeDocument({
      organizationId: "org.graph",
      userId: "u-1",
      documentId: ingested.document.id,
      kind: "financial",
    });
    expect(summary.citationIds.length).toBeGreaterThan(0);

    expect(() =>
      k.summarizeDocument({
        organizationId: "org.graph",
        userId: "u-1",
        documentId: k.uploadDocument({
          organizationId: "org.graph",
          userId: "u-1",
          title: "Empty",
          content: "no extractable patterns here xyz",
        }).document.id,
        kind: "executive",
      })
    ).toThrow(/evidence/i);
  });

  it("permissions, sharing, workflows, recommendations", () => {
    const k = createKnowledgeEngine();
    const { document } = k.uploadDocument({
      organizationId: "org.perm",
      userId: "u-admin",
      title: "Contract",
      content: "Legal contract with Vendor ACME",
      typeKey: "contract_legal",
    });
    k.grantPermission({
      organizationId: "org.perm",
      scope: "organization",
      principalId: "u-admin",
      actions: Object.freeze(["admin", "read", "write"]),
    });
    expect(
      k.hasPermission({
        organizationId: "org.perm",
        principalId: "u-admin",
        action: "read",
      })
    ).toBe(true);

    k.shareDocument({
      organizationId: "org.perm",
      userId: "u-admin",
      documentId: document.id,
      principalId: "u-reader",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const wf = k.startWorkflow({
      organizationId: "org.perm",
      userId: "u-admin",
      documentId: document.id,
      kind: "approval",
      assigneeId: "u-reader",
    });
    expect(wf.status).toBe("pending");
    expect(
      k.completeWorkflow({
        organizationId: "org.perm",
        userId: "u-reader",
        workflowId: wf.id,
      }).status
    ).toBe("completed");

    k.extractEntities({
      organizationId: "org.perm",
      userId: "u-admin",
      documentId: document.id,
    });
    const recs = k.generateRecommendations({ organizationId: "org.perm" });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.documentIds.length > 0)).toBe(true);
  });

  it("publishes twin, evidence ledger, organizational memory events", () => {
    const k = createKnowledgeEngine();
    k.ingest({
      organizationId: "org.evt",
      userId: "u-1",
      title: "Minutes",
      content: "Board minutes Date: 2026-07-01",
      typeKey: "minutes",
    });
    expect(k.listEvents("org.evt").length).toBeGreaterThan(0);
    expect(k.listTwinProjections("org.evt").length).toBeGreaterThan(0);
    expect(k.listEvidenceLedger("org.evt").length).toBeGreaterThan(0);
    expect(k.listMemoryRecords("org.evt").length).toBeGreaterThan(0);
  });

  it("regression: FinanceEngine and CFO still operate independently", () => {
    const finance = createFinanceEngine();
    const boot = finance.bootstrap({
      organizationId: "org.reg",
      userId: "u-cfo",
    });
    expect("error" in boot).toBe(false);
    const cfo = createChiefFinancialOfficerEngine();
    expect(cfo.guards.recommendsOnly).toBe(true);
    const k = createKnowledgeEngine();
    k.uploadDocument({
      organizationId: "org.reg",
      userId: "u-1",
      title: "Bank Statement",
      content: "Statement July 2026",
      typeKey: "statement",
    });
    expect(k.listDocuments("org.reg")).toHaveLength(1);
  });
});
