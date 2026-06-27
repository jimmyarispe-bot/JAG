import { vi } from "vitest";

vi.mock("@/lib/integration-hub/event-bus", () => ({
  publishEvent: vi.fn().mockResolvedValue(undefined),
}));
