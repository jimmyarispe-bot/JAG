export function googleWorkspaceInstanceId(organizationId: string): string {
  return `google-${organizationId}`;
}

export const GOOGLE_WORKSPACE_CONNECTOR_ID = "google";
export const GOOGLE_WORKSPACE_PROVIDER_VERSION = "1.1.0";
