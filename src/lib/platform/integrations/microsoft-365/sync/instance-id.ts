export function microsoft365InstanceId(organizationId: string): string {
  return `microsoft-${organizationId}`;
}

export const MICROSOFT_365_CONNECTOR_ID = "microsoft";
export const MICROSOFT_365_PROVIDER_VERSION = "1.1.0";
export const MICROSOFT_365_PROVIDER = "microsoft_365" as const;
