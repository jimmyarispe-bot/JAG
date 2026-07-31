/**
 * Manufacturing Industry Blueprint v1 — primarily declarative industry knowledge.
 *
 * Foundation behavior comes from production Capability Packs (attached by
 * Organization Blueprints). This blueprint owns vocabulary, modules, catalogs,
 * and studio suggestions — not runtime logic, MES engines, or package ids.
 *
 * Architectural validation only — definitions, not calculations.
 */

import type { IndustryBlueprint } from "@/jag/blueprints/contracts";
import { manufacturingIndustryCatalogPayload } from "@/jag/blueprints/industries/manufacturing/catalogs";
import { MANUFACTURING_BLUEPRINT_COMPOSITION } from "@/jag/blueprints/industries/manufacturing/composition";
import { MANUFACTURING_INDUSTRY_ENTITIES } from "@/jag/blueprints/industries/manufacturing/entities";
import { MANUFACTURING_STUDIO_PROFILE } from "@/jag/blueprints/industries/manufacturing/studio-profile";

export const MANUFACTURING_INDUSTRY_ID = "manufacturing" as const;

export const ManufacturingIndustryBlueprint: IndustryBlueprint = Object.freeze({
  id: MANUFACTURING_INDUSTRY_ID,
  label: "Manufacturing",
  description:
    "Declarative manufacturing industry blueprint — vocabulary, modules, and catalogs. Shared behavior is composed from foundation Capability Packs by organizations. Definitions only — not MES or optimization engines.",
  version: MANUFACTURING_BLUEPRINT_COMPOSITION.version,
  tags: Object.freeze([
    "manufacturing",
    "bom",
    "work_orders",
    "inventory",
    "declarative",
    "v1",
  ]),
  modules: Object.freeze([
    ...MANUFACTURING_BLUEPRINT_COMPOSITION.foundationModules,
    ...MANUFACTURING_BLUEPRINT_COMPOSITION.verticalModules,
  ]),
  studioProfile: MANUFACTURING_STUDIO_PROFILE,
  entities: MANUFACTURING_INDUSTRY_ENTITIES,
  terminology: Object.freeze([
    Object.freeze({
      id: "industry.manufacturing.terminology.default",
      label: "Manufacturing default terminology",
      terms: Object.freeze({
        employee: "Employee",
        operator: "Operator",
        supervisor: "Supervisor",
        technician: "Technician",
        vendor: "Vendor",
        customer: "Customer",
        workOrder: "Work Order",
        site: "Plant",
      }),
    }),
  ]),
  permissions: Object.freeze([
    Object.freeze({
      id: "industry.manufacturing.permission.core",
      label: "Manufacturing core permissions",
      description: "Baseline manufacturing permission catalog (industry data).",
      permissions: Object.freeze([
        "manufacturing.access",
        "manufacturing.work_orders.read",
        "manufacturing.work_orders.update",
        "manufacturing.inventory.read",
        "manufacturing.scheduling.read",
        "manufacturing.reports.read",
      ]),
    }),
  ]),
  reports: Object.freeze([
    Object.freeze({
      id: "industry.manufacturing.report.production_output",
      applicationId: "manufacturing",
      title: "Production Output",
      domain: "production",
      entityType: "WorkItem",
      fields: Object.freeze(["id", "status", "workType", "title"]),
      requiredPermission: "manufacturing.reports.read",
      version: "1.0.0",
    }),
    Object.freeze({
      id: "industry.manufacturing.report.downtime",
      applicationId: "manufacturing",
      title: "Downtime Report",
      domain: "scheduling",
      entityType: "ScheduleItem",
      fields: Object.freeze(["id", "status", "startAt", "schedulableType"]),
      requiredPermission: "manufacturing.reports.read",
      version: "1.0.0",
    }),
  ]),
  integrations: Object.freeze([
    Object.freeze({
      id: "industry.manufacturing.integration.mes",
      kind: "mes",
      label: "Manufacturing Execution System",
    }),
    Object.freeze({
      id: "industry.manufacturing.integration.erp",
      kind: "erp",
      label: "ERP / Inventory",
    }),
    Object.freeze({
      id: "industry.manufacturing.integration.scheduling",
      kind: "scheduling",
      label: "Production Scheduling",
    }),
  ]),
  configuration: Object.freeze({
    keys: Object.freeze({
      industry: "manufacturing",
      blueprintEdition: "v1",
      composition: MANUFACTURING_BLUEPRINT_COMPOSITION,
      catalogs: manufacturingIndustryCatalogPayload(),
    }),
  }),
});
