export type AcademyEmailMessage = {
  to: string | string[];
  subject: string;
  body: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
};

export type AcademyEmailResult = {
  success: boolean;
  provider: "resend" | "memory" | "none";
  messageId?: string;
  error?: string;
};

export type EmailProvider = {
  readonly id: "resend" | "memory" | "none";
  send(message: AcademyEmailMessage): Promise<AcademyEmailResult>;
};
