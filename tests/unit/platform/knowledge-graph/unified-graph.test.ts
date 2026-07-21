import { describe, expect, it, beforeEach } from "vitest";
import {
  createIntegrationPlatformCore,
  registerCrmPlatformConnectors,
  registerHrPlatformConnectors,
  registerEducationPlatformConnectors,
  registerFinancePlatformConnectors,
  crmStore,
  hrStore,
  educationStore,
  financeStore,
} from "@/lib/platform/integrations";
import {
  UNIFIED_ENTITY_TYPES,
  UNIFIED_RELATIONSHIPS,
  rebuildUnifiedKnowledgeGraph,
  softReadOrganizationalGraph,
  softReadSearch,
  softReadTimeline,
  softReadLineage,
  softReadNeighborhood,
  buildKnowledgeGraphEccWidgets,
  unifiedGraphStore,
  resolveUnifiedEntityType,
  normalizeRelationshipType,
} from "@/lib/platform/knowledge-graph";

describe("RC-4 — Unified Knowledge Graph", () => {
  beforeEach(() => {
    crmStore.clear();
    hrStore.clear();
    educationStore.clear();
    financeStore.clear();
    unifiedGraphStore.clear();
  });

  describe("ontology", () => {
    it("declares all core entity types and relationships", () => {
      expect(UNIFIED_ENTITY_TYPES).toEqual(
        expect.arrayContaining([
          "Person",
          "Organization",
          "Department",
          "Meeting",
          "Communication",
          "Document",
          "Task",
          "Decision",
          "Initiative",
          "Portfolio",
          "Risk",
          "Opportunity",
          "FinancialTransaction",
          "Customer",
          "Vendor",
          "Employee",
          "Student",
          "Teacher",
          "Parent",
          "Class",
          "Course",
        ])
      );
      expect(UNIFIED_RELATIONSHIPS).toEqual(
        expect.arrayContaining([
          "OWNS",
          "ATTENDS",
          "REPORTS_TO",
          "CREATED",
          "EDITED",
          "APPROVED",
          "ASSIGNED",
          "COMMUNICATED_WITH",
          "DEPENDS_ON",
          "BELONGS_TO",
          "PARTICIPATES_IN",
        ])
      );
    });

    it("aliases domain kinds and relationships into the unified ontology", () => {
      expect(resolveUnifiedEntityType("Teacher", { objectType: "teacher" })).toBe("Teacher");
      expect(resolveUnifiedEntityType("Organization", { objectType: "course" })).toBe("Course");
      expect(resolveUnifiedEntityType("Lead")).toBe("Person");
      expect(normalizeRelationshipType("REPORTS_TO")).toBe("REPORTS_TO");
      expect(normalizeRelationshipType("PART_OF")).toBe("BELONGS_TO");
      expect(normalizeRelationshipType("ASSIGNED_BY")).toBe("ASSIGNED");
    });
  });

  describe("ingest from canonical connector stores", () => {
    it("merges CRM + HR + Education + Finance into one organizational graph", async () => {
      const platform = createIntegrationPlatformCore();
      registerCrmPlatformConnectors(platform);
      registerHrPlatformConnectors(platform);
      registerEducationPlatformConnectors(platform);
      registerFinancePlatformConnectors(platform);

      for (const id of [
        "hubspot-org-kg-demo",
        "gusto-org-kg-demo",
        "canvas-org-kg-demo",
        "stripe-org-kg-demo",
      ]) {
        platform.lifecycle.seed(id, "connected");
      }

      expect((await platform.syncNow("hubspot", "hubspot-org-kg-demo", "full")).status).toBe(
        "succeeded"
      );
      expect((await platform.syncNow("gusto", "gusto-org-kg-demo", "full")).status).toBe(
        "succeeded"
      );
      expect((await platform.syncNow("canvas", "canvas-org-kg-demo", "full")).status).toBe(
        "succeeded"
      );
      expect((await platform.syncNow("stripe", "stripe-org-kg-demo", "full")).status).toBe(
        "succeeded"
      );

      const graph = rebuildUnifiedKnowledgeGraph("org-kg-demo");
      expect(graph).toBeTruthy();
      expect(graph!.nodes.length).toBeGreaterThan(10);
      expect(graph!.edges.length).toBeGreaterThan(0);
      expect(graph!.domainsConnected).toEqual(
        expect.arrayContaining(["crm", "hr", "education", "finance"])
      );
      expect(graph!.kindsPresent).toEqual(
        expect.arrayContaining(["Person", "Employee", "Student", "Teacher"])
      );
      expect(graph!.relationshipTypesPresent.every((t) => UNIFIED_RELATIONSHIPS.includes(t as never))).toBe(
        true
      );
    });
  });

  describe("soft-read API", () => {
    it("exposes graph, search, timeline, lineage, and neighborhood without connector APIs", async () => {
      const platform = createIntegrationPlatformCore();
      registerCrmPlatformConnectors(platform);
      registerEducationPlatformConnectors(platform);
      platform.lifecycle.seed("hubspot-org-kg-demo", "connected");
      platform.lifecycle.seed("canvas-org-kg-demo", "connected");
      await platform.syncNow("hubspot", "hubspot-org-kg-demo", "full");
      await platform.syncNow("canvas", "canvas-org-kg-demo", "full");

      const soft = softReadOrganizationalGraph("org-kg-demo");
      expect(soft).toBeTruthy();
      expect(soft!.sourceSystem).toBe("knowledge-graph");
      expect(soft!.counts.nodes).toBeGreaterThan(0);
      expect(soft!.ontology.entityTypes).toContain("Student");

      const students = softReadSearch("org-kg-demo", { kinds: ["Student"] });
      expect(students.length).toBeGreaterThan(0);

      const timeline = softReadTimeline("org-kg-demo");
      expect(timeline.length).toBeGreaterThan(0);

      const lineage = softReadLineage("org-kg-demo");
      expect(lineage.length).toBeGreaterThan(0);

      const seed = soft!.graph.nodes[0]!;
      const neighborhood = softReadNeighborhood("org-kg-demo", seed.id, 1);
      expect(neighborhood).toBeTruthy();
      expect(neighborhood!.nodes.length).toBeGreaterThan(0);
    });
  });

  describe("ECC widgets", () => {
    it("builds organizational_graph widget from the unified store", async () => {
      const platform = createIntegrationPlatformCore();
      registerCrmPlatformConnectors(platform);
      platform.lifecycle.seed("hubspot-org-kg-demo", "connected");
      await platform.syncNow("hubspot", "hubspot-org-kg-demo", "full");

      const widgets = buildKnowledgeGraphEccWidgets("exec-demo-org");
      expect(widgets).toBeTruthy();
      expect(widgets!.organizationalGraph.kind).toBe("organizational_graph");
      expect(widgets!.organizationalGraph.nodeCount).toBeGreaterThan(0);
    });
  });
});
