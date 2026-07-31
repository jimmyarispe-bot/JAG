import type {
  CommunicationDelivery,
  CommunicationDeliveryId,
  CommunicationMessage,
  CommunicationMessageId,
} from "@/jag/communications/contracts/definitions";

const messages = new Map<CommunicationMessageId, CommunicationMessage>();
const deliveries = new Map<CommunicationMessageId, CommunicationDelivery[]>();
const deliveryIndex = new Map<CommunicationDeliveryId, CommunicationDelivery>();

export function putCommunicationMessage(message: CommunicationMessage): void {
  messages.set(message.id, message);
}

export function getCommunicationMessage(
  messageId: CommunicationMessageId
): CommunicationMessage | null {
  return messages.get(messageId) ?? null;
}

export function listCommunicationMessages(filter?: {
  organizationId?: string;
  status?: CommunicationMessage["status"];
}): CommunicationMessage[] {
  let all = [...messages.values()];
  if (filter?.organizationId) {
    all = all.filter((m) => m.organizationId === filter.organizationId);
  }
  if (filter?.status) {
    all = all.filter((m) => m.status === filter.status);
  }
  return all.sort((a, b) => a.id.localeCompare(b.id));
}

export function putCommunicationDelivery(delivery: CommunicationDelivery): void {
  const list = deliveries.get(delivery.messageId) ?? [];
  const idx = list.findIndex((d) => d.id === delivery.id);
  if (idx >= 0) list[idx] = delivery;
  else list.push(delivery);
  deliveries.set(delivery.messageId, list);
  deliveryIndex.set(delivery.id, delivery);
}

export function listCommunicationDeliveries(
  messageId: CommunicationMessageId
): readonly CommunicationDelivery[] {
  return deliveries.get(messageId) ?? [];
}

export function getCommunicationDelivery(
  deliveryId: CommunicationDeliveryId
): CommunicationDelivery | null {
  return deliveryIndex.get(deliveryId) ?? null;
}

export function resetCommunicationMessageStoreForTests(): void {
  messages.clear();
  deliveries.clear();
  deliveryIndex.clear();
}
