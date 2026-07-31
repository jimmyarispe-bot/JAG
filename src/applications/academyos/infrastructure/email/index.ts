export type {
  AcademyEmailMessage,
  AcademyEmailResult,
  EmailProvider,
} from "@/applications/academyos/infrastructure/email/types";
export {
  createMemoryEmailProvider,
  type MemoryEmailProvider,
} from "@/applications/academyos/infrastructure/email/memory-email-provider";
export { createResendEmailProvider } from "@/applications/academyos/infrastructure/email/resend-email-provider";
