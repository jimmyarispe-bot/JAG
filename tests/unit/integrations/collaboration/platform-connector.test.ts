import { describe, expect, it, beforeEach } from "vitest";
import {
  createIntegrationPlatformCore,
  registerCollaborationPlatformConnectors,
  createSlackPlatformConnector,
  createTeamsPlatformConnector,
  createZoomPlatformConnector,
  createGoogleMeetPlatformConnector,
  createDemoCollaborationClient,
  reconnectSlack,
  collaborationCanonicalType,
  COLLABORATION_OBJECT_TYPES,
  COLLABORATION_KG_KINDS,
  COLLABORATION_PROVIDERS,
  buildCommunicationGraph,
  buildCollaborationEccWidgets,
  collaborationStore,
  registerAllConnectors,
  createIntegrationPlatform,
  slackMetadata,
  teamsMetadata,
  zoomMetadata,
  googleMeetMetadata,
} from "@/lib/platform/integrations";
import { createOiosOperatingSystem } from "@/lib/platform/oios";

describe("RC-3.02 — Collaboration Intelligence", () => {
  beforeEach(() => {
    collaborationStore.clear();
  });

  describe("catalog", () => {
    it("registers Slack, Teams, Zoom, and Google Meet as non-placeholder production connectors", () => {
      const platform = registerAllConnectors(createIntegrationPlatform());
      for (const [id, meta] of [
        ["slack", slackMetadata],
        ["teams", teamsMetadata],
        ["zoom", zoomMetadata],
        ["google_meet", googleMeetMetadata],
      ] as const) {
        const connector = platform.getConnector(id);
        expect(connector).toBeTruthy();
        expect(connector!.metadata.placeholder).toBe(false);
        expect(connector!.metadata.version).toBe(meta.version);
      }
      expect(platform.getConnector("slack")!.metadata.objectTypes).toContain("channel");
      expect(platform.getConnector("teams")!.metadata.objectTypes).toContain("chat");
      expect(platform.getConnector("zoom")!.metadata.objectTypes).toContain("recording");
      expect(platform.getConnector("google_meet")!.metadata.objectTypes).toContain("meet");
      expect(COLLABORATION_PROVIDERS).toEqual(
        expect.arrayContaining(["slack", "teams", "zoom", "google_meet"])
      );
    });
  });

  describe("auth lifecycle", () => {
    it("installs, refreshes, disconnects, and reconnects Slack", async () => {
      const connector = createSlackPlatformConnector({
        client: createDemoCollaborationClient("slack"),
      });
      const auth = await connector.authenticate("slack-org-1");
      expect(auth.ok).toBe(true);
      const refreshed = await connector.refreshAuthentication("slack-org-1");
      expect(refreshed.ok).toBe(true);
      await connector.disconnect("slack-org-1");
      expect((await connector.validate("slack-org-1")).ok).toBe(false);
      expect((await reconnectSlack(connector, "slack-org-1")).ok).toBe(true);
    });
  });

  describe("canonical mapping", () => {
    it("maps Slack / Teams / Zoom / Meet objects into shared canonical types", () => {
      expect(collaborationCanonicalType("message")).toBe("comms.message");
      expect(collaborationCanonicalType("channel")).toBe("person.group");
      expect(collaborationCanonicalType("meet")).toBe("comms.meeting");
      expect(collaborationCanonicalType("reaction")).toBe("comms.reaction");
      expect(collaborationCanonicalType("attendance")).toBe("comms.attendance");
      expect(COLLABORATION_OBJECT_TYPES).toContain("thread");
      expect(COLLABORATION_KG_KINDS).toEqual(
        expect.arrayContaining(["Person", "Organization", "Meeting", "Communication", "Document"])
      );
    });
  });

  describe("sync", () => {
    it("syncs Slack, Teams, Zoom, and Google Meet into the collaboration store", async () => {
      const platform = createIntegrationPlatformCore();
      registerCollaborationPlatformConnectors(platform);
      platform.lifecycle.seed("slack-org-collab-demo", "connected");
      platform.lifecycle.seed("teams-org-collab-demo", "connected");
      platform.lifecycle.seed("zoom-org-collab-demo", "connected");
      platform.lifecycle.seed("google_meet-org-collab-demo", "connected");

      const slack = await platform.syncNow("slack", "slack-org-collab-demo", "full");
      const teams = await platform.syncNow("teams", "teams-org-collab-demo", "full");
      const zoom = await platform.syncNow("zoom", "zoom-org-collab-demo", "full");
      const meet = await platform.syncNow(
        "google_meet",
        "google_meet-org-collab-demo",
        "full"
      );

      expect(slack.status).toBe("succeeded");
      expect(teams.status).toBe("succeeded");
      expect(zoom.status).toBe("succeeded");
      expect(meet.status).toBe("succeeded");
      expect(meet.recordsFetched).toBeGreaterThan(3);

      const snap = collaborationStore.listForOrganization("org-collab-demo");
      expect(snap.map((s) => s.provider).sort()).toEqual([
        "google_meet",
        "slack",
        "teams",
        "zoom",
      ]);
    });
  });

  describe("Collaboration Intelligence", () => {
    it("builds Communication Graph, Network, Latency, Department Interaction, Meeting Density, Trends, and alerts", async () => {
      const platform = createIntegrationPlatformCore();
      registerCollaborationPlatformConnectors(platform);
      for (const id of [
        "slack-org-collab-demo",
        "teams-org-collab-demo",
        "zoom-org-collab-demo",
        "google_meet-org-collab-demo",
      ]) {
        platform.lifecycle.seed(id, "connected");
      }
      await platform.syncNow("slack", "slack-org-collab-demo", "full");
      await platform.syncNow("teams", "teams-org-collab-demo", "full");
      await platform.syncNow("zoom", "zoom-org-collab-demo", "full");
      await platform.syncNow("google_meet", "google_meet-org-collab-demo", "full");

      const graph = buildCommunicationGraph("org-collab-demo");
      expect(graph).toBeTruthy();
      expect(graph!.nodes.length).toBeGreaterThan(0);
      expect(graph!.collaborationNetwork.length).toBeGreaterThan(0);
      expect(graph!.silos.length).toBeGreaterThan(0);
      expect(graph!.responseLatency.length).toBeGreaterThan(0);
      expect(graph!.collaborationDensity.length).toBeGreaterThan(0);
      expect(graph!.departmentInteraction.length).toBeGreaterThan(0);
      expect(graph!.meetingDensity.length).toBeGreaterThan(0);
      expect(graph!.communicationTrends.length).toBeGreaterThan(0);
      expect(graph!.bottlenecks.length).toBeGreaterThan(0);
      expect(graph!.executiveAlerts.length).toBeGreaterThan(0);
      expect(
        graph!.executiveAlerts.some((a) => a.kind === "isolated_teams")
      ).toBe(true);
      expect(
        graph!.executiveAlerts.some((a) => a.kind === "communication_bottlenecks")
      ).toBe(true);
      expect(graph!.scores.communicationHealth).toBeGreaterThan(0);
      expect(graph!.scores.meetingLoadMinutes).toBeGreaterThan(0);
      expect(graph!.scores.meetingDensityScore).toBeGreaterThan(0);
    });
  });

  describe("ECC widgets", () => {
    it("builds Communication Health, Collaboration Heatmap, and Meeting Load", async () => {
      const platform = createIntegrationPlatformCore();
      registerCollaborationPlatformConnectors(platform);
      platform.lifecycle.seed("slack-org-collab-demo", "connected");
      platform.lifecycle.seed("teams-org-collab-demo", "connected");
      platform.lifecycle.seed("zoom-org-collab-demo", "connected");
      platform.lifecycle.seed("google_meet-org-collab-demo", "connected");
      await platform.syncNow("slack", "slack-org-collab-demo", "full");
      await platform.syncNow("teams", "teams-org-collab-demo", "full");
      await platform.syncNow("zoom", "zoom-org-collab-demo", "full");
      await platform.syncNow("google_meet", "google_meet-org-collab-demo", "full");

      const widgets = buildCollaborationEccWidgets("exec-demo-org");
      expect(widgets).toBeTruthy();
      expect(widgets!.communicationHealth.kind).toBe("communication_health");
      expect(widgets!.collaborationHeatmap.kind).toBe("collaboration_heatmap");
      expect(widgets!.meetingLoad.kind).toBe("meeting_load");
      expect(widgets!.collaborationHeatmap.cells.length).toBeGreaterThan(0);
      expect(widgets!.communicationHealth.alertCount).toBeGreaterThan(0);
      expect(widgets!.meetingLoad.meetingDensityScore).toBeGreaterThan(0);
    });
  });

  describe("platform connector factories", () => {
    it("exposes Teams, Zoom, and Google Meet platform connectors", () => {
      expect(createTeamsPlatformConnector().id).toBe("teams");
      expect(createZoomPlatformConnector().id).toBe("zoom");
      expect(createGoogleMeetPlatformConnector().id).toBe("google_meet");
    });
  });

  describe("OIOS registration", () => {
    it("registers Slack, Teams, Zoom, and Google Meet on Integration Platform Core", () => {
      const oios = createOiosOperatingSystem({ wireOrganizationDna: false });
      expect(oios.integrations?.registry.has("slack")).toBe(true);
      expect(oios.integrations?.registry.has("teams")).toBe(true);
      expect(oios.integrations?.registry.has("zoom")).toBe(true);
      expect(oios.integrations?.registry.has("google_meet")).toBe(true);
      expect(oios.integrations?.registry.getVersion("google_meet")).toBe("1.1.0");
    });
  });
});
