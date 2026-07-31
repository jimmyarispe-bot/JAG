import type {
  AuthEmailKind,
  OrganizationEmailBrand,
  RenderedAuthEmail,
} from "@/lib/platform/auth-email/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function greeting(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? `Hi ${trimmed},` : "Hello,";
}

function supportLine(brand: OrganizationEmailBrand): string {
  if (brand.supportEmail) {
    return `Need help? Contact ${brand.supportEmail}.`;
  }
  return "Need help? Contact your administrator.";
}

function logoBlock(brand: OrganizationEmailBrand): string {
  if (!brand.logoUrl) return "";
  return `<img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(
    brand.displayName
  )}" width="160" style="display:block;max-width:160px;height:auto;margin:0 0 24px;" />`;
}

function layoutHtml(input: {
  brand: OrganizationEmailBrand;
  title: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaHref: string;
  footerNote?: string;
}): string {
  const { brand } = input;
  const paras = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155;">${p}</p>`
    )
    .join("");
  const footer = input.footerNote
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#64748b;">${input.footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="height:6px;background:${escapeHtml(brand.primaryColor)};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 28px 28px;">
              ${logoBlock(brand)}
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${escapeHtml(
                brand.secondaryColor
              )};">${escapeHtml(brand.applicationName)}</p>
              <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#0f172a;">${escapeHtml(
                input.title
              )}</h1>
              ${paras}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
                <tr>
                  <td style="border-radius:8px;background:${escapeHtml(brand.primaryColor)};">
                    <a href="${escapeHtml(input.ctaHref)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(
                      input.ctaLabel
                    )}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#64748b;word-break:break-all;">Or paste this link into your browser:<br /><a href="${escapeHtml(
                input.ctaHref
              )}" style="color:${escapeHtml(brand.primaryColor)};">${escapeHtml(
                input.ctaHref
              )}</a></p>
              ${footer}
              <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">${escapeHtml(
                brand.displayName
              )}${brand.website ? ` · ${escapeHtml(brand.website)}` : ""}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function layoutText(input: {
  brand: OrganizationEmailBrand;
  title: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaHref: string;
  footerNote?: string;
}): string {
  const lines = [
    input.brand.applicationName,
    input.title,
    "",
    ...input.paragraphs,
    "",
    `${input.ctaLabel}: ${input.ctaHref}`,
  ];
  if (input.footerNote) {
    lines.push("", input.footerNote);
  }
  lines.push("", input.brand.displayName);
  if (input.brand.website) lines.push(input.brand.website);
  return lines.join("\n");
}

function renderShell(input: {
  kind: AuthEmailKind;
  brand: OrganizationEmailBrand;
  subject: string;
  title: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaHref: string;
  footerNote?: string;
}): RenderedAuthEmail {
  return {
    kind: input.kind,
    subject: input.subject,
    html: layoutHtml(input),
    text: layoutText(input),
  };
}

/** Subjects never mention Supabase. */
export function authEmailSubject(
  kind: AuthEmailKind,
  brand: OrganizationEmailBrand
): string {
  const org = brand.displayName;
  switch (kind) {
    case "invitation":
      return `You've been invited to ${org}`;
    case "password_reset":
      return `Reset your password for ${org}`;
    case "verify_email":
      return `Verify your email for ${org}`;
    case "email_changed":
      return `Your ${org} email was changed`;
    case "account_activated":
      return `Your ${org} account is ready`;
    case "mfa_recovery":
      return `Your ${org} recovery code`;
    default:
      return `${org} account notice`;
  }
}

export function renderInvitationEmail(input: {
  brand: OrganizationEmailBrand;
  actionUrl: string;
  recipientName?: string | null;
}): RenderedAuthEmail {
  const g = greeting(input.recipientName);
  return renderShell({
    kind: "invitation",
    brand: input.brand,
    subject: authEmailSubject("invitation", input.brand),
    title: `Join ${input.brand.displayName}`,
    paragraphs: [
      escapeHtml(g),
      `You've been invited to ${escapeHtml(input.brand.displayName)} on ${escapeHtml(
        input.brand.applicationName
      )}.`,
      "Accept the invitation to create your password and activate your account.",
    ],
    ctaLabel: "Accept invitation",
    ctaHref: input.actionUrl,
    footerNote: `${escapeHtml(supportLine(input.brand))} If you were not expecting this invitation, you can ignore this email.`,
  });
}

export function renderPasswordResetEmail(input: {
  brand: OrganizationEmailBrand;
  actionUrl: string;
  recipientName?: string | null;
}): RenderedAuthEmail {
  const g = greeting(input.recipientName);
  return renderShell({
    kind: "password_reset",
    brand: input.brand,
    subject: authEmailSubject("password_reset", input.brand),
    title: "Reset your password",
    paragraphs: [
      escapeHtml(g),
      `A password reset was requested for your ${escapeHtml(input.brand.displayName)} account.`,
      "Use the button below to choose a new password. This link expires for your security.",
    ],
    ctaLabel: "Reset password",
    ctaHref: input.actionUrl,
    footerNote: `${escapeHtml(supportLine(input.brand))} If you did not request this, you can ignore this email.`,
  });
}

export function renderVerifyEmail(input: {
  brand: OrganizationEmailBrand;
  actionUrl: string;
  recipientName?: string | null;
}): RenderedAuthEmail {
  const g = greeting(input.recipientName);
  return renderShell({
    kind: "verify_email",
    brand: input.brand,
    subject: authEmailSubject("verify_email", input.brand),
    title: "Verify your email",
    paragraphs: [
      escapeHtml(g),
      `Please verify your email address for ${escapeHtml(input.brand.displayName)}.`,
    ],
    ctaLabel: "Verify email",
    ctaHref: input.actionUrl,
    footerNote: `${escapeHtml(supportLine(input.brand))} If you did not create an account, you can ignore this email.`,
  });
}

export function renderEmailChangedEmail(input: {
  brand: OrganizationEmailBrand;
  actionUrl?: string;
  recipientName?: string | null;
  newEmail?: string;
}): RenderedAuthEmail {
  const g = greeting(input.recipientName);
  const href = input.actionUrl || input.brand.website || "#";
  return renderShell({
    kind: "email_changed",
    brand: input.brand,
    subject: authEmailSubject("email_changed", input.brand),
    title: "Email address changed",
    paragraphs: [
      escapeHtml(g),
      `The email on your ${escapeHtml(input.brand.displayName)} account was changed${
        input.newEmail ? ` to ${escapeHtml(input.newEmail)}` : ""
      }.`,
      "If you made this change, no further action is required.",
    ],
    ctaLabel: "Open account",
    ctaHref: href,
    footerNote: `${escapeHtml(supportLine(input.brand))} If you did not request this change, contact support immediately.`,
  });
}

export function renderAccountActivatedEmail(input: {
  brand: OrganizationEmailBrand;
  actionUrl: string;
  recipientName?: string | null;
}): RenderedAuthEmail {
  const g = greeting(input.recipientName);
  return renderShell({
    kind: "account_activated",
    brand: input.brand,
    subject: authEmailSubject("account_activated", input.brand),
    title: "Your account is ready",
    paragraphs: [
      escapeHtml(g),
      `Your ${escapeHtml(input.brand.displayName)} account on ${escapeHtml(
        input.brand.applicationName
      )} is active.`,
      "Sign in anytime with the email and password you created.",
    ],
    ctaLabel: "Sign in",
    ctaHref: input.actionUrl,
    footerNote: escapeHtml(supportLine(input.brand)),
  });
}
