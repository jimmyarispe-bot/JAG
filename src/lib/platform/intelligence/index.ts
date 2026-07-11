/**
 * JAG Intelligence — Phase 1 foundation public API.
 *
 * Shared cognitive services for the autonomous intelligence layer.
 * See `docs/architecture/JAG_INTELLIGENCE_ARCHITECTURE.md`.
 */

export * from "@/lib/platform/intelligence/types";
export * from "@/lib/platform/intelligence/context";
export * from "@/lib/platform/intelligence/context/builder";
export * from "@/lib/platform/intelligence/context/cache";
export * from "@/lib/platform/intelligence/context/executive-context";
export * from "@/lib/platform/intelligence/context/finance-context";
export * from "@/lib/platform/intelligence/context/student-context";
export * from "@/lib/platform/intelligence/context/organization-context";
export * from "@/lib/platform/intelligence/memory";
export * from "@/lib/platform/intelligence/memory/index";
export * from "@/lib/platform/intelligence/reasoning";
export * from "@/lib/platform/intelligence/planner";
export * from "@/lib/platform/intelligence/execution";
export * from "@/lib/platform/intelligence/knowledge";
export * from "@/lib/platform/intelligence/confidence";
export * from "@/lib/platform/intelligence/learning";
export * from "@/lib/platform/intelligence/case-engine";
export * from "@/lib/platform/intelligence/events";
export * from "@/lib/platform/intelligence/explain";
export * from "@/lib/platform/intelligence/orchestrator";
export * from "@/lib/platform/intelligence/contracts";
export * from "@/lib/platform/intelligence/registry";
export * from "@/lib/platform/intelligence/router";
export * from "@/lib/platform/intelligence/service";
export * from "@/lib/platform/intelligence/create-service";
export * from "@/lib/platform/intelligence/domains/support";
export * from "@/lib/platform/intelligence/domains/executive";
export * from "@/lib/platform/intelligence/domains/strategic";
export * from "@/lib/platform/intelligence/decision";
export * from "@/lib/platform/intelligence/organization";
