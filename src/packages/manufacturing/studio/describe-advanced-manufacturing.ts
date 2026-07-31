/**
 * Advanced Manufacturing Company — Organization Studio answers.
 * Branding, facilities, structure, and org policies only.
 * Does not duplicate Manufacturing Industry Blueprint catalogs.
 */

import type { OrganizationStudioAnswers } from "@/jag/studio";
import { MANUFACTURING_INDUSTRY_ID } from "@/jag/blueprints";
import {
  ADVANCED_MANUFACTURING_ORGANIZATION_ID,
  MANUFACTURING_APPLICATION_ID,
  MANUFACTURING_PACKAGE_ID,
  MANUFACTURING_PACKAGE_VERSION,
} from "@/packages/manufacturing/package";

/**
 * Describe Advanced Manufacturing Company as Organization Studio answers.
 * Humans would answer these questions; this is the proof fixture.
 */
export function describeAdvancedManufacturingOrganization(): OrganizationStudioAnswers {
  return Object.freeze({
    industryId: MANUFACTURING_INDUSTRY_ID,
    organizationId: ADVANCED_MANUFACTURING_ORGANIZATION_ID,
    packageId: MANUFACTURING_PACKAGE_ID,
    applicationId: MANUFACTURING_APPLICATION_ID,
    version: MANUFACTURING_PACKAGE_VERSION,
    publisher: "Advanced Manufacturing Company",
    tags: Object.freeze([
      "manufacturing",
      "advanced-manufacturing",
      "bom",
      "work_orders",
    ]),
    identity: Object.freeze({
      name: "Advanced Manufacturing Company",
      mission:
        "Produce precision discrete goods with safe, high-quality, continuous operations.",
      vision: "World-class manufacturing through disciplined operations.",
      brand: "Advanced Manufacturing",
      timeZone: "America/Chicago",
      languages: Object.freeze(["en"]),
    }),
    locations: Object.freeze([
      Object.freeze({
        id: "plant.midwest",
        kind: "plant",
        name: "Midwest Assembly Plant",
        region: "Midwest",
        country: "US",
      }),
      Object.freeze({
        id: "plant.south",
        kind: "plant",
        name: "Southern Fabrication Plant",
        region: "South",
        country: "US",
      }),
      Object.freeze({
        id: "warehouse.central",
        kind: "warehouse",
        name: "Central Distribution Warehouse",
        region: "Midwest",
        country: "US",
      }),
      Object.freeze({
        id: "region.national",
        kind: "region",
        name: "National Operations",
        country: "US",
      }),
    ]),
    programs: Object.freeze([
      Object.freeze({
        id: "discrete_assembly",
        label: "Discrete Assembly",
        category: "production",
      }),
      Object.freeze({
        id: "quality_assurance",
        label: "Quality Assurance",
        category: "quality",
      }),
      Object.freeze({
        id: "maintenance",
        label: "Maintenance",
        category: "operations",
      }),
      Object.freeze({
        id: "shipping",
        label: "Shipping & Logistics",
        category: "logistics",
      }),
    ]),
    roles: Object.freeze([
      Object.freeze({ id: "ceo", label: "CEO" }),
      Object.freeze({ id: "plant_manager", label: "Plant Manager" }),
      Object.freeze({ id: "supervisor", label: "Supervisor" }),
      Object.freeze({ id: "operator", label: "Operator" }),
      Object.freeze({ id: "technician", label: "Technician" }),
    ]),
    calendars: Object.freeze([
      Object.freeze({
        id: "production",
        kind: "operational",
        label: "Production Calendar",
      }),
      Object.freeze({
        id: "maintenance",
        kind: "operational",
        label: "Maintenance Calendar",
      }),
      Object.freeze({
        id: "fiscal",
        kind: "fiscal",
        label: "Fiscal Calendar",
      }),
    ]),
    policies: Object.freeze([
      Object.freeze({
        id: "safety",
        label: "Safety",
        category: "compliance",
      }),
      Object.freeze({
        id: "quality",
        label: "Quality",
        category: "compliance",
      }),
      Object.freeze({
        id: "environmental",
        label: "Environmental",
        category: "compliance",
      }),
    ]),
    integrations: Object.freeze([
      Object.freeze({
        id: "mes",
        provider: "mes",
        enabled: false,
        label: "External MES",
      }),
      Object.freeze({
        id: "erp",
        provider: "erp",
        enabled: false,
        label: "ERP",
      }),
    ]),
    ai: Object.freeze({
      modules: Object.freeze([]),
      automations: Object.freeze([]),
      assistants: Object.freeze([]),
    }),
    enabledModules: Object.freeze([
      "identity",
      "documents",
      "communications",
      "scheduling",
      "work",
      "decision",
      "policy",
      "reporting",
      "analytics",
      "bom",
      "work_orders",
      "inventory",
    ]),
    terminologyOverrides: Object.freeze({
      employee: "Employee",
      operator: "Operator",
      site: "Plant",
    }),
  });
}
