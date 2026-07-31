import type {
  AcademyEmailMessage,
  EmailProvider,
} from "@/applications/academyos/infrastructure/email/types";

export type MemoryEmailProvider = EmailProvider & {
  outbox: AcademyEmailMessage[];
};

export function createMemoryEmailProvider(): MemoryEmailProvider {
  const outbox: AcademyEmailMessage[] = [];
  return {
    id: "memory",
    outbox,
    async send(message) {
      outbox.push({ ...message });
      return {
        success: true,
        provider: "memory",
        messageId: `mem_${outbox.length}`,
      };
    },
  };
}
