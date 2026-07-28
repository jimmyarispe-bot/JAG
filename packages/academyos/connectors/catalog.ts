/**
 * Education connector catalog — Platform SDK connectors (stubs for Sprint 2.1).
 * Full vendor runtimes are Phase 2 follow-ons; contracts are SDK-compliant now.
 */

import type {
  PlatformConnector,
  PlatformConnectorContext,
  PlatformConnectorSyncResult,
  TwinEntityMapping,
} from "@/lib/platform-sdk";
import type { PermissionDefinition } from "@/lib/platform-sdk";

export type EducationConnectorId =
  | "google-classroom"
  | "canvas"
  | "powerschool"
  | "clever"
  | "classlink"
  | "zoom"
  | "google-meet";

export type EducationConnectorDescriptor = {
  readonly id: EducationConnectorId;
  readonly name: string;
  readonly version: string;
  readonly status: "Planned" | "Stub";
  readonly twinMappings: readonly TwinEntityMapping[];
};

const connected = new Set<string>();

function ctxKey(id: string, organizationId: string): string {
  return `${id}::${organizationId}`;
}

function stubConnector(
  descriptor: EducationConnectorDescriptor
): PlatformConnector {
  const perms: PermissionDefinition[] = [
    {
      id: `academyos.connector.${descriptor.id}`,
      name: descriptor.name,
      description: `${descriptor.name} education connector`,
      scope: "Connector",
      resource: `connector.${descriptor.id}`,
      actions: ["connect", "sync"],
    },
  ];

  return {
    id: descriptor.id,
    version: descriptor.version,
    async connect(ctx: PlatformConnectorContext) {
      connected.add(ctxKey(descriptor.id, ctx.organizationId));
    },
    async disconnect(ctx: PlatformConnectorContext) {
      connected.delete(ctxKey(descriptor.id, ctx.organizationId));
    },
    async validate(ctx: PlatformConnectorContext) {
      if (!connected.has(ctxKey(descriptor.id, ctx.organizationId))) {
        throw new Error(`${descriptor.name} is not connected.`);
      }
    },
    async sync(_ctx: PlatformConnectorContext): Promise<PlatformConnectorSyncResult> {
      return {
        recordsImported: 0,
        evidenceCreated: 0,
        twinEntitiesUpdated: 0,
        jobId: null,
      };
    },
    async health(ctx: PlatformConnectorContext) {
      return connected.has(ctxKey(descriptor.id, ctx.organizationId))
        ? "Healthy"
        : "Offline";
    },
    capabilities() {
      return {
        operations: ["read", "sync", "import"],
        syncModes: ["Manual", "Scheduled"],
      };
    },
    entityMappings() {
      return descriptor.twinMappings;
    },
    permissions() {
      return perms;
    },
  };
}

export const EDUCATION_CONNECTOR_CATALOG: readonly EducationConnectorDescriptor[] =
  Object.freeze([
    {
      id: "google-classroom",
      name: "Google Classroom",
      version: "0.1.0",
      status: "Stub",
      twinMappings: [
        {
          sourceEntity: "Course",
          twinEntityType: "Product / Service",
          description: "Classroom course → Twin Product / Service",
        },
        {
          sourceEntity: "Student",
          twinEntityType: "Person",
          description: "Classroom student → Twin Person",
        },
      ],
    },
    {
      id: "canvas",
      name: "Canvas LMS",
      version: "0.1.0",
      status: "Stub",
      twinMappings: [
        {
          sourceEntity: "Course",
          twinEntityType: "Product / Service",
          description: "Canvas course → Twin Product / Service",
        },
      ],
    },
    {
      id: "powerschool",
      name: "PowerSchool",
      version: "0.1.0",
      status: "Stub",
      twinMappings: [
        {
          sourceEntity: "Student",
          twinEntityType: "Person",
          description: "SIS student → Twin Person",
        },
        {
          sourceEntity: "Enrollment",
          twinEntityType: "Person",
          description: "Enrollment as relationship metadata",
        },
      ],
    },
    {
      id: "clever",
      name: "Clever",
      version: "0.1.0",
      status: "Stub",
      twinMappings: [
        {
          sourceEntity: "Student",
          twinEntityType: "Person",
          description: "Roster sync → Twin Person",
        },
      ],
    },
    {
      id: "classlink",
      name: "ClassLink",
      version: "0.1.0",
      status: "Stub",
      twinMappings: [
        {
          sourceEntity: "Student",
          twinEntityType: "Person",
          description: "Roster sync → Twin Person",
        },
      ],
    },
    {
      id: "zoom",
      name: "Zoom",
      version: "0.1.0",
      status: "Stub",
      twinMappings: [
        {
          sourceEntity: "Meeting",
          twinEntityType: "Event",
          description: "Meeting → Twin Event",
        },
      ],
    },
    {
      id: "google-meet",
      name: "Google Meet",
      version: "0.1.0",
      status: "Stub",
      twinMappings: [
        {
          sourceEntity: "Meeting",
          twinEntityType: "Event",
          description: "Meet session → Twin Event",
        },
      ],
    },
  ]);

export function createEducationConnectors(): readonly PlatformConnector[] {
  return Object.freeze(
    EDUCATION_CONNECTOR_CATALOG.map((d) => stubConnector(d))
  );
}

export function resetEducationConnectorStateForTests(): void {
  connected.clear();
}
