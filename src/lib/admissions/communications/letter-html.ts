import type { MergeContext } from "@/lib/admissions/communications/merge-fields";
import { renderTemplate } from "@/lib/admissions/communications/merge-fields";

/**
 * The approved letter, as HTML, with its links as buttons.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * Jimmy, 10 October: "can you create an actual button that will go into these
 * emails with the links tied to them".
 *
 * ── THE TRAP THIS AVOIDS, WHICH IS THE WHOLE REASON IT IS A FILE AND NOT A
 *    LINE ──────────────────────────────────────────────────────────────────
 *
 * The Resend provider decides for itself whether a body is HTML:
 *
 *     function asHtml(body: string): string {
 *       if (/<[a-z][\s\S]*>/i.test(body)) return body;
 *       return body.replace(/\n/g, "<br>");
 *     }
 *
 * The instant a letter contains ONE tag, the newline conversion stops. Pushing
 * an <a> into an otherwise plain-text letter therefore does not add a button
 * to a letter - it collapses every paragraph of that letter into a single run
 * of text. So a letter is either entirely plain or entirely HTML, and this is
 * what makes it entirely HTML.
 *
 * ── NOT ONE WORD OF THE APPROVED COPY CHANGES ───────────────────────────────
 *
 * Jimmy, 4 October: "pls don't paraphrase. i cant follow this if the exact
 * language isn't in every part of this build." The template body in the
 * database is the source and is never edited here. This reads it, keeps every
 * word in order, and changes only presentation: blank lines become
 * paragraphs, single newlines become line breaks, and a link merge field
 * becomes a button sitting under the sentence that introduced it.
 *
 * The sentence keeps its words. "You can choose your time here:" still reads
 * "You can choose your time here:", with the button beneath it instead of a
 * naked URL trailing off the end of the line.
 *
 * ── EVERY VALUE IS ESCAPED, WHICH PLAIN TEXT NEVER HAD TO BE ────────────────
 *
 * The moment a letter is HTML, a guardian called "Smith & Jones" or a note
 * containing "<" stops being text and starts being markup. renderTemplate
 * does no escaping - it never needed to - so this file escapes the template's
 * own words AND every merge value it substitutes, separately, and puts the
 * link value only into an href.
 *
 * ── AND IT STILL SENDS THE PLAIN LETTER ─────────────────────────────────────
 *
 * The caller passes the original rendered text as the multipart `text` part.
 * A client that refuses HTML gets exactly the letter that was sent yesterday,
 * URL and all.
 */

/** A merge field whose value is a URL. Matched by name so a new one is covered. */
const LINK_FIELD = /^(?:.*_)?(?:link|url)(?:_.*)?$/i;

function isLinkField(key: string): boolean {
  return LINK_FIELD.test(key) || /link|url/i.test(key);
}

/**
 * What the button says.
 *
 * THESE ARE WORDS A HUMAN READS, so they are listed here one by one rather
 * than generated from the field name, and Jimmy sees them before they ship.
 * A field with no entry falls back to FALLBACK_LABEL, which is deliberately
 * plain rather than clever.
 */
export const BUTTON_LABELS: Readonly<Record<string, string>> = {
  scheduling_link: "Choose your time",
  tour_link: "Choose your tour time",
  shadow_days_link: "Choose your shadow days",
  // "Complete the application", not "Open the application", at Jimmy's
  // instruction of 13 October 2026, reviewing application_invite_email and
  // parent_reminder_application_not_started. THIS MAP IS KEYED BY MERGE FIELD,
  // NOT BY LETTER, so the three letters that carry {{application_link}} all
  // change together: those two plus parent_reminder_application_not_submitted.
  // He was told that before this line was changed. A per-letter override would
  // be a different design; this is one word on one button in three places.
  application_link: "Complete the application",
  application_call_link: "Record this conversation",
  post_call_link: "Record your notes",
  meeting_link: "Join the meeting",
  upload_link: "Upload your documents",
  portal_link: "Open your portal",
  enrollment_link: "Complete enrollment",
  handbook_link: "Open the handbook",
  lead_link: "Open this child's record",
  decisions_link: "Open the decision",
  call_link: "Record this call",
  interest_link_action: "Send the link",
};

const FALLBACK_LABEL = "Open this link";

const INK = "#0f172a";
const BODY_INK = "#334155";
const MUTED = "#64748b";
const FAINT = "#94a3b8";
const RULE = "#e2e8f0";
const PRIMARY = "#1e3a5f";
/*
 * THE BUTTON COLOUR. Jimmy, 10 October: "make the buttons orange pls",
 * then "show me purple", then "show me halloween orange button", and finally,
 * having seen all four: "lets go w purple with white lettering inside the
 * buttons". Settled: #7c3aed, white label.
 *
 * WHATEVER COLOUR THIS BECOMES, IT HAS TO CLEAR 4.5:1 AGAINST WHITE. The
 * label is white, 15px and bold, which is NOT "large text" by the
 * accessibility rule - that starts at 18.66px bold - so the 3:1 allowance
 * does not apply. #7c3aed measures about 5.7:1. For reference: #c2410c
 * (orange) is 4.9:1 and passes; #ea580c, the obvious bright orange, is 3.6:1
 * and leaves the label washed out on a phone in daylight.
 *
 * No brand orange exists to match: branding/defaults.ts carries indigo, slate
 * and green and nothing warm. Say the word and this is one line.
 */
const BUTTON = "#7c3aed";
/*
 * THE LABEL IS NOT ALWAYS WHITE, AND THIS IS WHY IT IS A VARIABLE.
 *
 * White on the chosen purple is 5.7:1 and fine. It is a variable because the
 * colours tried on the way here proved it has to be: Halloween orange,
 * #ff7518, is a LIGHT colour, and white on it measures 2.7:1 - well under the
 * 4.5:1 this label needs, looking exactly as thin as that number says on a
 * phone outdoors. Near-black on that orange is 7.8:1.
 *
 * So the label colour follows the button colour rather than being assumed.
 * A dark button takes a white label; a light one takes a dark label. Anyone
 * changing BUTTON should check this against the button, not guess.
 */
const BUTTON_INK = "#ffffff";
/*
 * AND THE "paste this into your browser" LINK IS A THIRD COLOUR, because it
 * is 12px text ON WHITE rather than a label on the button. #ff7518 as text on
 * white was 2.7:1 and genuinely hard to read, so it needed a darker shade of
 * the same hue. The purple settled on is 5.7:1 as text on white, so here it
 * is simply the button colour again - but the variable stays, because the
 * next colour may not be so forgiving.
 */
const LINK_INK = "#7c3aed";
const PAGE = "#f1f5f9";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A URL safe to put in an href, or null when there is nothing to link to. */
function safeHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  /*
   * http and https ONLY. A merge value is data, and a letter that will link
   * anywhere a value tells it to is a letter that will one day carry
   * javascript: to a school leader. An unrecognised scheme is dropped and the
   * text is left as it was, which is visible and harmless.
   */
  if (!/^https?:\/\//i.test(trimmed)) return null;
  if (/[\s"'<>]/.test(trimmed)) return null;
  return trimmed;
}

/**
 * The button, built from pieces that are ALREADY HTML-SAFE.
 *
 * Both callers arrive with their values escaped at different moments - the
 * plain-text path escapes here, the already-HTML path escaped when it
 * substituted the merge field - so escaping lives in the callers and this
 * function does not touch what it is handed. Escaping twice is how a URL
 * with an &amp; in it turns into a dead link, and that is not a failure
 * anybody notices before a parent clicks.
 */
function buttonBlockRaw(hrefAttr: string, labelHtml: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;">` +
    `<tr><td style="border-radius:8px;background:${BUTTON};">` +
    `<a href="${hrefAttr}" style="display:inline-block;padding:13px 24px;font-size:15px;` +
    `font-weight:600;color:${BUTTON_INK};text-decoration:none;">${labelHtml}</a>` +
    `</td></tr></table>` +
    /* The naked URL stays, smaller, underneath. A button is not a link to
       somebody whose client strips tables, and a letter that becomes
       unusable in Outlook is worse than an ugly one. */
    `<p style="margin:6px 0 18px;font-size:12px;line-height:1.5;color:${MUTED};word-break:break-all;">` +
    `Or paste this into your browser:<br />` +
    `<a href="${hrefAttr}" style="color:${LINK_INK};">${hrefAttr}</a></p>`
  );
}

function buttonBlock(href: string, label: string): string {
  return buttonBlockRaw(escapeHtml(href), escapeHtml(label));
}

/**
 * A PARAGRAPH THAT IS NOTHING BUT ONE LINK IS A BUTTON TOO.
 *
 * Jimmy, 10 October: "can you create an actual button that will go into these
 * emails with the links tied to them." The commit that answered him was called
 * "every link in every letter is a button now", and it was not true. It
 * covered the eighty-four plain-text templates and left the eighty-fifth -
 * inquiry_staff_alert, the one written in HTML - with its call to action as a
 * bare underlined link, which is exactly how it arrived in the test campus's
 * first staff alert on 12 October.
 *
 * MY REASONING FOR SKIPPING IT WAS WRONG, and the comment above looksHtml
 * still carried it: "a link somebody wrote an anchor around is a decision
 * already taken." That is a reasonable rule about MARKUP and the wrong answer
 * to what Jimmy asked. He did not ask for buttons where the author forgot to
 * write one. He asked for buttons.
 *
 * ── WHY THIS SHAPE, AND NOT "EVERY ANCHOR" ──────────────────────────────────
 *
 * An anchor ALONE IN ITS OWN PARAGRAPH is a call to action - the same thing a
 * bare URL alone on its line is in a plain-text letter, which is the rule
 * renderBlock already applies. An anchor with words around it is part of a
 * sentence, and a button in the middle of a sentence is not a button.
 *
 * inquiry_staff_alert shows both in one letter, which is why the distinction
 * has to hold:
 *
 *   <p>Email: <a href="mailto:...">...</a><br>Phone: <a href="tel:...">...</a></p>
 *   <p><a href="{{interest_link_action}}">Send them the interest meeting link</a></p>
 *
 * The first paragraph has text before each anchor and stays as it is. The
 * second becomes the button. The mailto: and tel: links would be refused by
 * the scheme check below in any case - a second reason for the same answer,
 * which is what should be true of a rule worth keeping.
 */
const SOLE_ANCHOR_PARAGRAPH =
  /<p[^>]*>\s*<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<\/p>/gi;

function buttonsForSoleAnchorParagraphs(html: string): string {
  return html.replace(
    SOLE_ANCHOR_PARAGRAPH,
    (whole: string, hrefAttr: string, inner: string) => {
      /* http and https ONLY, the same refusal safeHref makes and for the same
         reason: a merge value is data. mailto: and tel: are left as links,
         which is what they should look like anyway. */
      if (!/^https?:\/\//i.test(hrefAttr)) return whole;
      if (/[\s<>]/.test(hrefAttr)) return whole;
      /* The label is the anchor's own words. Any nested markup - a <strong>
         somebody wrapped it in - is dropped, because a button's label is text
         and keeping it would put tags inside the <a> this builds. */
      const labelHtml = inner.replace(/<[^>]*>/g, "").trim();
      if (!labelHtml) return whole;
      return buttonBlockRaw(hrefAttr, labelHtml);
    }
  );
}

/**
 * One block of the letter, escaped, with its merge values filled in.
 *
 * Returns the inline HTML and, separately, the first link it found - the
 * caller decides whether that becomes a button.
 */
function renderBlock(
  raw: string,
  ctx: MergeContext
): { html: string; link: { href: string; label: string } | null } {
  let link: { href: string; label: string } | null = null;
  let html = "";
  const pattern = /\{\{(\w+)\}\}/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(raw)) !== null) {
    html += escapeHtml(raw.slice(cursor, match.index));
    cursor = match.index + match[0].length;

    const key = match[1];
    const value = renderTemplate(match[0], ctx);
    /* renderTemplate hands back "{{key}}" unchanged for a field it does not
       know. That is its own guard against a letter inventing a value, and it
       must survive into the HTML looking exactly as wrong as it is. */
    const unresolved = value === match[0];

    if (!unresolved && isLinkField(key)) {
      const href = safeHref(value);
      if (href) {
        if (!link) link = { href, label: BUTTON_LABELS[key] ?? FALLBACK_LABEL };
        /*
         * THE URL COMES OUT OF THE SENTENCE. It is about to appear twice
         * below - once as a button, once in full underneath it - and three
         * times is where a letter starts to look broken. Any ": " or " -"
         * the sentence used to introduce it is trimmed by the caller.
         */
        continue;
      }
      /* No usable URL - GA and FL have no Meet link for a telephone call.
         The value is written as it is, which is usually nothing, and the
         sentence reads as it always did. */
    }
    html += escapeHtml(value);
  }
  html += escapeHtml(raw.slice(cursor));

  /*
   * A sentence that ended by handing over a URL now ends before it. Drop the
   * punctuation that was only there to introduce the link, and any newline
   * left where the link used to sit - the notes letter ends a block with
   * {{meeting_link}} on its own line, and without this the letter carries a
   * stray <br /> straight into the button.
   */
  html = html.replace(/[ \t\n]*[:\-–—]?[ \t\n]*$/u, "");
  html = html.replace(/\n/g, "<br />");
  return { html, link };
}

/**
 * The approved letter as a full HTML document.
 *
 * `rawBody` is the template body BEFORE merging - the merging happens here so
 * the escaping can tell the template's words apart from a family's data.
 */
/**
 * The document every letter arrives in.
 *
 * ONE SHELL FOR BOTH PATHS - the plain-text templates this file lays out, and
 * the one that was already written in HTML and is passed through. Two shells
 * would be two sets of colours, two widths and two chances for a letter to
 * look like it came from somewhere else.
 */
function shell(input: {
  subject: string;
  schoolName?: string | null;
  inner: string;
}): string {
  const header = input.schoolName?.trim()
    ? `<p style="margin:0 0 20px;font-size:12px;font-weight:600;letter-spacing:0.04em;` +
      `text-transform:uppercase;color:${FAINT};">${escapeHtml(input.schoolName.trim())}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${RULE};">
<tr><td style="height:6px;background:${PRIMARY};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:32px 28px 28px;">
${header}${input.inner}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * A template that is ALREADY HTML, which one of them is.
 *
 * ── THE LETTER THIS BROKE ───────────────────────────────────────────────────
 *
 * 11 October 2026. Jimmy submitted a real inquiry at The Academy FL to test
 * the chain end to end, and the first email Danni received read:
 *
 *   <p><strong>2:27 test on 10.11</strong> - new inquiry at The Academy
 *   FL.</p><p>Program: In-Person</p>...
 *
 * Every tag, as text, in her inbox.
 *
 * Eighty-four of the eighty-five active templates are plain text, and those
 * are the ones this file was built and checked against. inquiry_staff_alert
 * is the eighty-fifth. It was written in HTML, and escaping its own markup
 * turned a letter into a view-source.
 *
 * WORSE, QUIETLY: it carries its own anchor, `<a href="{{interest_link_action}}">`,
 * and the link-to-button rule pulled that merge field out of the sentence to
 * make a button - leaving `href=""` behind. The letter lost its link as well
 * as its formatting.
 *
 * ── WHAT THIS DOES INSTEAD ──────────────────────────────────────────────────
 *
 * Passes the markup through untouched and substitutes the merge values,
 * ESCAPED, because a guardian called "Smith & Jones" is still data inside an
 * HTML template and escaping an & inside an href is correct there too.
 *
 * NO PARAGRAPH WRAPPING. The author already wrote the paragraphs.
 *
 * It said NO BUTTON too, until 12 October, on the reasoning that an anchor
 * the author wrote is a decision already taken. That was wrong - see
 * buttonsForSoleAnchorParagraphs below. An anchor alone in its own paragraph
 * now becomes a button here as well, which is what Jimmy asked for in the
 * first place.
 *
 * ── WHY A HEURISTIC, AND THE SAME ONE ───────────────────────────────────────
 *
 * `/<[a-z][\s\S]*>/i` is exactly the test the Resend provider's asHtml uses
 * to decide the same question one layer down. Two different answers to "is
 * this HTML" in one send path is the shape of bug that takes a day to find,
 * so there is one answer and this is it.
 */
function looksLikeHtml(body: string): boolean {
  return /<[a-z][\s\S]*>/i.test(body);
}

/** Merge values filled in, markup left exactly as the author wrote it. */
function renderHtmlTemplate(raw: string, ctx: MergeContext): string {
  return raw.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => {
    const value = renderTemplate(whole, ctx);
    /* renderTemplate hands back "{{key}}" for a field it does not know. That
       must survive looking exactly as wrong as it is. */
    if (value === whole) return escapeHtml(whole);
    void key;
    return escapeHtml(value);
  });
}

export function renderLetterHtml(params: {
  rawBody: string;
  subject: string;
  ctx: MergeContext;
  schoolName?: string | null;
}): string {
  /*
   * WINDOWS LINE ENDINGS FIRST, AND THIS IS NOT THEORETICAL.
   *
   * Every approved body in admissions_communication_templates is stored with
   * \r\n. A blank line between paragraphs is therefore "\r\n\r\n", and a
   * paragraph split looking for "\n\n" finds nothing in it - the whole letter
   * would arrive as one block with visible gaps and no button placement.
   * Checked against the live rows on 10 October before this line was written.
   */
  const normalised = params.rawBody.replace(/\r\n?/g, "\n");

  /*
   * ALREADY HTML? Hand it back as it was written. See looksLikeHtml above for
   * the letter that taught this file the difference.
   */
  if (looksLikeHtml(params.rawBody)) {
    return shell({
      subject: params.subject,
      schoolName: params.schoolName,
      inner: buttonsForSoleAnchorParagraphs(
        renderHtmlTemplate(params.rawBody, params.ctx)
      ),
    });
  }

  const blocks = normalised
    .split(/\n[ \t]*\n/)
    .map((b) => b.replace(/\s+$/u, ""))
    .filter((b) => b.trim().length > 0);

  const rendered = blocks
    .map((block) => {
      const { html, link } = renderBlock(block, params.ctx);
      const paragraph = html.trim()
        ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BODY_INK};">${html}</p>`
        : "";
      return paragraph + (link ? buttonBlock(link.href, link.label) : "");
    })
    .join("");

  return shell({
    subject: params.subject,
    schoolName: params.schoolName,
    inner: rendered,
  });
}
