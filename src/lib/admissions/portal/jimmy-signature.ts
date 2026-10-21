/**
 * JIMMY'S ACADEMY WAY SIGNATURE, ON LETTERS THAT GO OUT OVER HIS NAME.
 *
 * Jimmy, 21 October 2026: "add my academy way signature and title to these
 * emails and put the specific school underneath the academy way".
 *
 * Copied from his Gmail signature (sent 21 Oct 2026): photo, Academy Way logo,
 * LinkedIn / Facebook / Instagram, name, "CEO/Founder", "The Academy Way
 * Network of Schools", email, website, Smyrna address. The one addition is
 * the campus, on its own line directly under "The Academy Way Network of
 * Schools".
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ICON = "https://cdn2.hubspot.net/hubfs/53/tools/email-signature-generator/icons";
const PHOTO = "https://img1.wsimg.com/isteam/ip/a014ef31-8368-4906-82a1-788625aa4ca0/blob-714ed29.png/:/rs=h:175,m";
const LOGO = "https://img1.wsimg.com/isteam/ip/a014ef31-8368-4906-82a1-788625aa4ca0/WAY%20network%20clear%20background.png/:/rs=h:175,m";

function social(href: string, icon: string, alt: string): string {
  return `<a href="${href}" style="display:inline-block;padding:0;background-color:#000dff;border-radius:50%"><img src="${ICON}/${icon}" alt="${alt}" width="24" style="display:block;border-radius:inherit"></a>`;
}

function contactRow(icon: string, alt: string, html: string): string {
  return (
    `<tr style="vertical-align:middle;height:28px">` +
    `<td width="26" style="vertical-align:middle"><span style="display:inline-block;background-color:#ff9900"><img src="${ICON}/${icon}" alt="${alt}" width="18" style="display:block"></span></td>` +
    `<td style="padding:0;color:#000000;font-size:14px">${html}</td></tr>`
  );
}

/** The signature block. `schoolName` is the campus line; omitted when blank. */
export function jimmySignatureHtml(schoolName?: string | null): string {
  const school = (schoolName ?? "").trim();
  const line = (text: string) =>
    `<div style="margin:0;color:#000000;font-size:14px;line-height:22px">${text}</div>`;

  return (
    `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;margin-top:8px"><tr>` +
    `<td style="vertical-align:top;text-align:center;padding-right:28px">` +
    `<img src="${PHOTO}" width="110" alt="Jimmy Arispe" style="display:block;max-width:110px;margin:0 auto 16px">` +
    `<img src="${LOGO}" width="110" alt="The Academy Way Network of Schools" style="display:block;max-width:110px;margin:0 auto 16px">` +
    social("https://www.linkedin.com/company/80506426", "linkedin-icon-dark-2x.png", "LinkedIn") +
    `<span style="display:inline-block;width:5px"></span>` +
    social("https://www.facebook.com/TheAcademyWay/", "facebook-icon-dark-2x.png", "Facebook") +
    `<span style="display:inline-block;width:5px"></span>` +
    social("https://www.instagram.com/theacademy_way/", "instagram-icon-dark-2x.png", "Instagram") +
    `</td>` +
    `<td style="vertical-align:middle">` +
    `<div style="margin:0;font-size:18px;font-weight:bold;color:#000000;line-height:28px">Jimmy Arispe</div>` +
    line("CEO/Founder") +
    line("The Academy Way Network of Schools") +
    (school ? line(esc(school)) : "") +
    `<div style="height:1px;border-bottom:1px solid #ff9900;margin:16px 0"></div>` +
    `<table cellpadding="0" cellspacing="0" border="0" style="line-height:1">` +
    contactRow("email-icon-dark-2x.png", "Email", `<a href="mailto:Jimmy.Arispe@TheAcademyWay.org" style="color:#000000">Jimmy.Arispe@TheAcademyWay.org</a>`) +
    contactRow("link-icon-dark-2x.png", "Website", `<a href="https://www.theacademyway.org/" style="color:#000000">www.TheAcademyWay.org</a>`) +
    contactRow("address-icon-dark-2x.png", "Address", `2690 Cobb Parkway SE, Suite A5 #128, Smyrna, GA 30080`) +
    `</table>` +
    `</td></tr></table>`
  );
}
