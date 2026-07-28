/**
 * QuickBooks synchronization via Connector Runtime (does not bypass runtime).
 *
 * Pack queues Customers / Invoices / Payments / Credits, then invokes
 * `createQuickBooksRuntime().sync()`. Report-centric QBO sync remains the
 * connector's native behavior; entity push mapping is tracked pack-locally
 * (see PER-QBO-ENTITY-PUSH).
 */

import { randomUUID } from "node:crypto";
import { createQuickBooksRuntime } from "@/lib/connectors/orchestrator/adapters/quickbooks";
import { emitFinanceEvent } from "./events";
import {
  listCredits,
  listFamilyAccounts,
  listInvoices,
  listPayments,
  listQbSync,
  upsertInvoice,
  upsertPayment,
  upsertQbSync,
} from "./store";

export type FinanceQuickBooksSyncResult = {
  readonly ok: boolean;
  readonly connectorJobId: string | null;
  readonly queued: number;
  readonly synced: number;
  readonly failed: number;
  readonly message: string;
  readonly records: readonly ReturnType<typeof listQbSync>;
};

export function createFinanceQuickBooksService() {
  return {
    listSync: listQbSync,

    async synchronize(input: {
      organizationId: string;
      organizationName?: string;
      actorUserId: string;
      actorDisplayName?: string;
      demo?: boolean;
    }): Promise<FinanceQuickBooksSyncResult> {
      const runtime = createQuickBooksRuntime();
      const ctx = {
        organizationId: input.organizationId,
        organizationName: input.organizationName ?? input.organizationId,
        actorUserId: input.actorUserId,
        actorDisplayName: input.actorDisplayName ?? input.actorUserId,
        demo: input.demo ?? true,
      };

      // Ensure connector session via runtime (demo connect is SDK-supported).
      const health = await runtime.health(ctx);
      if (!health.ok) {
        const connected = await runtime.connect(ctx);
        if (!connected.ok) {
          return {
            ok: false,
            connectorJobId: null,
            queued: 0,
            synced: 0,
            failed: 0,
            message: connected.message,
            records: listQbSync(input.organizationId),
          };
        }
      }

      const now = new Date().toISOString();
      const queuedIds: string[] = [];

      const queue = (
        entityType: "Customer" | "Invoice" | "Payment" | "Credit",
        entityId: string
      ) => {
        const row = upsertQbSync({
          id: randomUUID(),
          organizationId: input.organizationId,
          entityType,
          entityId,
          status: "Queued",
          connectorJobId: null,
          message: "Queued for Connector Runtime sync",
          syncedAt: null,
          createdAt: now,
        });
        queuedIds.push(row.id);
      };

      for (const acct of listFamilyAccounts(input.organizationId)) {
        queue("Customer", acct.id);
      }
      for (const inv of listInvoices(input.organizationId)) {
        if (inv.status !== "Draft" && inv.status !== "Cancelled") {
          queue("Invoice", inv.id);
        }
      }
      for (const pay of listPayments(input.organizationId)) {
        if (pay.status === "Completed" || pay.status === "Refunded") {
          queue("Payment", pay.id);
        }
      }
      for (const credit of listCredits(input.organizationId)) {
        queue("Credit", credit.id);
      }

      const syncResult = await runtime.sync(ctx);
      const jobId = syncResult.jobId ?? null;
      let synced = 0;
      let failed = 0;

      for (const id of queuedIds) {
        const current = listQbSync(input.organizationId).find((r) => r.id === id);
        if (!current) continue;
        if (syncResult.ok) {
          upsertQbSync({
            ...current,
            status: "Synced",
            connectorJobId: jobId,
            message: syncResult.message,
            syncedAt: new Date().toISOString(),
          });
          synced += 1;
          if (current.entityType === "Invoice") {
            const inv = listInvoices(input.organizationId).find(
              (i) => i.id === current.entityId
            );
            if (inv) {
              upsertInvoice({ ...inv, quickbooksSyncId: jobId });
            }
          }
          if (current.entityType === "Payment") {
            const pay = listPayments(input.organizationId).find(
              (p) => p.id === current.entityId
            );
            if (pay) {
              upsertPayment({ ...pay, quickbooksSyncId: jobId });
            }
          }
        } else {
          upsertQbSync({
            ...current,
            status: "Failed",
            connectorJobId: jobId,
            message: syncResult.message,
            syncedAt: null,
          });
          failed += 1;
        }
      }

      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "QuickBooksSync",
        entityId: jobId ?? randomUUID(),
        eventType: syncResult.ok ? "quickbooks_synced" : "quickbooks_sync_failed",
        actor: input.actorUserId,
        metadata: {
          queued: String(queuedIds.length),
          synced: String(synced),
        },
      });

      return {
        ok: syncResult.ok,
        connectorJobId: jobId,
        queued: queuedIds.length,
        synced,
        failed,
        message: syncResult.message,
        records: listQbSync(input.organizationId),
      };
    },
  };
}
