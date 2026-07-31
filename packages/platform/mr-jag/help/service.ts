/**
 * MrJagHelpService — natural-language help from repository evidence.
 */

import { searchMrJagKnowledge } from "../knowledge";
import { adaptAnswerTone, normalizePersona } from "../personas";
import { recordQuestion } from "../store";
import { listRegisteredWalkthroughs } from "../tutorials/registry";
import type { HelpEvidence, HelpResponse, MrJagPersona } from "../types";

function detectIntent(question: string): string {
  const q = question.toLowerCase();
  if (/(invite|add).*(teacher|staff|employee)/.test(q)) return "invite_teacher";
  if (/invoice/.test(q) && /(disappear|missing|gone|can't find|cannot find)/.test(q))
    return "invoices_missing";
  if (/google|workspace|sync/.test(q)) return "google_workspace_sync";
  if (/how do i|how to/.test(q)) return "how_to";
  if (/why (is|are|does|did)/.test(q)) return "why";
  if (/where (is|do|can)/.test(q)) return "where";
  if (/what (is|does|means)/.test(q)) return "terminology";
  return "general";
}

function intentHints(intent: string): {
  search: string;
  fixes: string[];
  walkthroughHint?: string;
} {
  switch (intent) {
    case "invite_teacher":
      return {
        search: "invite teacher workforce employee onboarding permissions",
        fixes: [
          "Confirm the actor has workforce invite permission.",
          "Verify the invite email provider (Resend) is configured.",
          "Check AcademyOS workforce / HR onboarding docs.",
        ],
        walkthroughHint: "employee",
      };
    case "invoices_missing":
      return {
        search: "invoice tuition billing finance family account",
        fixes: [
          "Confirm the correct organization and campus filter.",
          "Check family account linkage for the student.",
          "Review finance billing / RC operations diagnostics if data looks wiped.",
        ],
      };
    case "google_workspace_sync":
      return {
        search: "google workspace connector sync oauth",
        fixes: [
          "Re-authorize the Google Workspace connector.",
          "Confirm connector status in integrations settings.",
          "Review connector sync logs and Studio recommendations.",
        ],
      };
    default:
      return { search: "", fixes: [] };
  }
}

export class MrJagHelpService {
  answer(input: {
    question: string;
    persona?: string | null;
    userId?: string;
    root?: string;
    includeGraph?: boolean;
  }): HelpResponse {
    const persona: MrJagPersona = normalizePersona(input.persona);
    const intent = detectIntent(input.question);
    const hints = intentHints(intent);
    const query = `${input.question} ${hints.search}`.trim();

    const hits = searchMrJagKnowledge({
      query,
      root: input.root,
      includeGraph: input.includeGraph === true,
      limit: 10,
    });

    const evidence: HelpEvidence[] = hits.map((h) => ({
      source: h.kind,
      id: h.id,
      title: h.title,
      excerpt: h.excerpt,
      path: h.path,
    }));

    const walks = listRegisteredWalkthroughs({ persona }).filter((w) => {
      if (!hints.walkthroughHint) return evidence.some((e) => e.id === w.pageId);
      return (
        w.title.toLowerCase().includes(hints.walkthroughHint) ||
        w.pageId.includes(hints.walkthroughHint)
      );
    });

    const pages = evidence
      .filter((e) => e.source === "tutorial")
      .map((e) => e.id);

    let core: string;
    if (evidence.length === 0) {
      core =
        "I could not find strong repository evidence for that yet. Try rephrasing, or open the related product help page and ask again with a screen name.";
    } else {
      const top = evidence.slice(0, 3);
      core = [
        `Here's what repository evidence suggests for: “${input.question.trim()}”.`,
        ...top.map(
          (e, i) =>
            `${i + 1}. **${e.title}** (${e.source})${e.path ? ` — ${e.path}` : ""}: ${e.excerpt}`
        ),
      ].join("\n");
    }

    if (input.userId) recordQuestion({ userId: input.userId, question: input.question });

    return {
      question: input.question,
      persona,
      answer: adaptAnswerTone(persona, core),
      intent,
      evidence: Object.freeze(evidence),
      recommendedWalkthroughIds: Object.freeze(walks.map((w) => w.id)),
      recommendedPageIds: Object.freeze([...new Set(pages)]),
      fixRecommendations: Object.freeze(hints.fixes),
      generatedAt: new Date().toISOString(),
    };
  }
}

export function createMrJagHelpService(): MrJagHelpService {
  return new MrJagHelpService();
}
