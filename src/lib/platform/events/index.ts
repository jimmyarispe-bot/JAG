/** Platform Event Bus — B-06 foundation + Sprint 024 messaging */
import "@/lib/platform/events/registry/register";

export * from "@/lib/platform/events/types";
export * from "@/lib/platform/events/version";
export * from "@/lib/platform/events/catalog/catalog";
export * from "@/lib/platform/events/registry/registry";
export * from "@/lib/platform/events/registry/validate";
export * from "@/lib/platform/events/envelope";
export * from "@/lib/platform/events/subscriber/subscribe";
export * from "@/lib/platform/events/dispatch/dispatcher";
export * from "@/lib/platform/events/dispatch/delivery";
export * from "@/lib/platform/events/dispatch/dead-letter";
export * from "@/lib/platform/events/publisher/publish";
export * from "@/lib/platform/events/replay/replay";
export * from "@/lib/platform/events/audit/audit";
export * from "@/lib/platform/events/persistence";

/** Sprint 024 surfaces */
export * from "@/lib/platform/events/core";
export * from "@/lib/platform/events/publishers";
export * from "@/lib/platform/events/subscribers";
export * from "@/lib/platform/events/handlers";
export * from "@/lib/platform/events/schemas";
export * from "@/lib/platform/events/serialization";
export * from "@/lib/platform/events/analytics";
export * from "@/lib/platform/events/security";
