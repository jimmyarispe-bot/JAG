/**
 * RC-2 — local HTTP target for failure injection + offline harness validation.
 * Simulates integration/db/cache/queue failure modes with controllable latency.
 */

import { createServer, type Server } from "node:http";

export type LocalTargetControls = {
  dbLatencyMs: number;
  integrationTimeout: boolean;
  cacheFail: boolean;
  queueBacklog: number;
  externalApiFail: boolean;
  reset: () => void;
};

export type LocalTarget = {
  baseUrl: string;
  server: Server;
  controls: LocalTargetControls;
  close: () => Promise<void>;
};

export async function startLocalTarget(port = 0): Promise<LocalTarget> {
  const controls: LocalTargetControls = {
    dbLatencyMs: 0,
    integrationTimeout: false,
    cacheFail: false,
    queueBacklog: 0,
    externalApiFail: false,
    reset() {
      this.dbLatencyMs = 0;
      this.integrationTimeout = false;
      this.cacheFail = false;
      this.queueBacklog = 0;
      this.externalApiFail = false;
    },
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;

    if (path === "/__controls") {
      if (req.method === "POST") {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Partial<LocalTargetControls>;
          Object.assign(controls, body);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, controls }));
        } catch {
          res.writeHead(400);
          res.end("bad json");
        }
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(controls));
      return;
    }

    if (path === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", probe: "liveness" }));
      return;
    }

    if (path === "/api/ready") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ready", probe: "readiness" }));
      return;
    }

    if (path === "/api/ready/deep") {
      if (controls.dbLatencyMs > 0) {
        await sleep(controls.dbLatencyMs);
      }
      const checks = [
        {
          name: "database",
          status: controls.dbLatencyMs > 2000 ? "degraded" : "healthy",
          latencyMs: controls.dbLatencyMs,
          detail: controls.dbLatencyMs ? `Injected latency ${controls.dbLatencyMs}ms` : "ok",
        },
        {
          name: "cache",
          status: controls.cacheFail ? "unavailable" : "healthy",
          detail: controls.cacheFail ? "Injected cache failure" : "ok",
        },
        {
          name: "queue_workers",
          status: controls.queueBacklog > 1000 ? "degraded" : "healthy",
          detail: `queueBacklog=${controls.queueBacklog}`,
        },
        {
          name: "integration:external",
          status: controls.externalApiFail || controls.integrationTimeout ? "degraded" : "healthy",
          detail: controls.integrationTimeout
            ? "Injected integration timeout"
            : controls.externalApiFail
              ? "Injected external API failure"
              : "ok",
        },
      ];
      const unavailable = checks.some((c) => c.status === "unavailable");
      const degraded = checks.some((c) => c.status === "degraded");
      const status = unavailable ? "unavailable" : degraded ? "degraded" : "healthy";
      res.writeHead(unavailable ? 503 : 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status, probe: "deep", checks, timestamp: new Date().toISOString() }));
      return;
    }

    if (path === "/api/observability/alerts") {
      const triggered = [] as Array<{ id: string; triggered: boolean }>;
      if (controls.dbLatencyMs > 500) triggered.push({ id: "db.slow", triggered: true });
      if (controls.externalApiFail) triggered.push({ id: "integration.fail", triggered: true });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ triggered, alerts: triggered }));
      return;
    }

    if (path.startsWith("/sim/integration")) {
      if (controls.integrationTimeout) {
        await sleep(5_000);
        res.writeHead(504);
        res.end("timeout");
        return;
      }
      if (controls.externalApiFail) {
        res.writeHead(502);
        res.end("upstream failed");
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (path.startsWith("/sim/retry")) {
      // Fail twice then succeed — models retry recovery.
      const n = Number(url.searchParams.get("n") ?? "0");
      if (n < 2) {
        res.writeHead(503);
        res.end("transient");
        return;
      }
      res.writeHead(200);
      res.end("recovered");
      return;
    }

    // Generic page-like responses for scenario paths on local target.
    if (controls.dbLatencyMs > 0) await sleep(Math.min(controls.dbLatencyMs, 50));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<html><body>${path}</body></html>`);
  });

  await new Promise<void>((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind local target");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    server,
    controls,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
