/**
 * Board & Governance Intelligence — GovernanceRepository (Sprint 029).
 */

import type { GovernanceRepository as GovernanceRepositoryContract } from "@/lib/platform/intelligence/board-governance/contracts";
import type {
  BoardPacket,
  GovernanceHistoryRecord,
  GraphScope,
} from "@/lib/platform/intelligence/board-governance/types";

function scopeMatches(
  scope: GraphScope | undefined,
  filter?: Partial<GraphScope>
): boolean {
  if (!filter) return true;
  if (
    filter.organizationId &&
    scope?.organizationId &&
    filter.organizationId !== scope.organizationId
  ) {
    return false;
  }
  if (
    filter.schoolId &&
    scope?.schoolId &&
    filter.schoolId !== scope.schoolId
  ) {
    return false;
  }
  return true;
}

/**
 * GovernanceRepository — in-memory packet + history store.
 */
export class GovernanceRepositoryStore
  implements GovernanceRepositoryContract
{
  private readonly packets = new Map<string, BoardPacket>();
  private readonly history = new Map<string, GovernanceHistoryRecord>();

  save(packet: BoardPacket): BoardPacket {
    this.packets.set(packet.id, packet);
    return packet;
  }

  get(packetId: string): BoardPacket | null {
    return this.packets.get(packetId) ?? null;
  }

  list(scope?: Partial<GraphScope>): BoardPacket[] {
    return [...this.packets.values()].filter((p) =>
      scopeMatches(p.scope, scope)
    );
  }

  remove(packetId: string): boolean {
    return this.packets.delete(packetId);
  }

  saveHistory(record: GovernanceHistoryRecord): GovernanceHistoryRecord {
    this.history.set(record.id, record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): GovernanceHistoryRecord[] {
    return [...this.history.values()].filter((h) =>
      scopeMatches(h.scope, scope)
    );
  }

  clear(): void {
    this.packets.clear();
    this.history.clear();
  }
}

/** Alias matching Sprint 029 naming. */
export { GovernanceRepositoryStore as GovernanceRepository };
