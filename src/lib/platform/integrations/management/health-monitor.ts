import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import type {
  ConnectorHealthReport,
  HealthHistoryRecord,
  HealthStatus,
} from "@/lib/platform/integrations/common/types";

export class ConnectorHealthMonitor {
  constructor(private readonly platform: IntegrationPlatform) {}

  async check(instanceId: string): Promise<ConnectorHealthReport> {
    const config = this.platform.persistence.getConfiguration(instanceId);
    if (!config) throw new Error(`Unknown instance: ${instanceId}`);
    const connector = this.platform.getConnector(config.connectorId);
    if (!connector) throw new Error(`Unknown connector: ${config.connectorId}`);

    const previous = this.platform.persistence.getHealth(instanceId);
    const report = await connector.healthCheck(instanceId);
    this.platform.persistence.saveHealth(report);

    if (previous && previous.status === "offline" && report.status === "healthy") {
      await this.platform.events.publish({
        type: "ConnectorRecovered",
        instanceId,
        connectorId: config.connectorId,
        payload: { from: previous.status, to: report.status },
      });
    }
    if (report.status === "offline" || report.status === "error") {
      await this.platform.events.publish({
        type: "ConnectorOffline",
        instanceId,
        connectorId: config.connectorId,
        payload: { status: report.status, error: report.lastError },
      });
    }
    if (report.status === "auth_required") {
      await this.platform.events.publish({
        type: "AuthenticationExpired",
        instanceId,
        connectorId: config.connectorId,
        payload: {},
      });
    }
    if (report.status === "rate_limited" || (report.rateLimitRemaining ?? 99) < 5) {
      await this.platform.events.publish({
        type: "ApiQuotaWarning",
        instanceId,
        connectorId: config.connectorId,
        payload: {
          remaining: report.rateLimitRemaining,
          limit: report.rateLimitPerMinute,
        },
      });
    }

    return report;
  }

  async checkAll(): Promise<ConnectorHealthReport[]> {
    const reports: ConnectorHealthReport[] = [];
    for (const config of this.platform.persistence.listConfigurations()) {
      if (!config.enabled) continue;
      reports.push(await this.check(config.instanceId));
    }
    return reports;
  }

  get(instanceId: string): ConnectorHealthReport | null {
    return this.platform.persistence.getHealth(instanceId);
  }

  history(instanceId?: string, limit = 50): HealthHistoryRecord[] {
    return this.platform.persistence.listHealthHistory(instanceId, limit);
  }

  status(instanceId: string): HealthStatus {
    return this.get(instanceId)?.status ?? "unknown";
  }
}
