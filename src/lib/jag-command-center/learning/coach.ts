/**
 * JAG Learning Coach — rule-based product guidance.
 * Does NOT call MrJagHelpService / repository documentation search.
 * Does NOT answer organizational intelligence questions (use /jag/chat).
 * Does NOT trust client persona/role — session + capability filters only.
 */

import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  canAccessJagLearningCenter,
  filterAccessibleTutorials,
} from "./authorization";
import { JAG_LEARN_TUTORIALS, pageIdForPathname } from "./catalog";
import { boundLearningOwnerId } from "./service";
import { getLearningPersistence } from "./store";
import type { JagLearnCoachAnswer, JagLearnTutorial } from "./types";

const HREF_BY_PAGE: Record<string, string> = {
  "jag.overview": "/jag",
  "jag.conversation": "/jag/chat",
  "jag.inbox": "/jag/inbox",
  "jag.decisions": "/jag/decisions",
  "jag.listening": "/jag/listening",
  "jag.briefings": "/jag/briefings",
  "jag.scenarios": "/jag/scenarios",
  "jag.memory": "/jag/memory",
  "jag.strategy": "/jag/strategy",
  "jag.learn": "/jag/learn",
  "jag.graph": "/jag/graph",
};

function matchTutorials(
  query: string,
  accessible: readonly JagLearnTutorial[]
): JagLearnTutorial[] {
  const q = query.toLowerCase();
  const scored = accessible
    .map((t) => {
      let score = 0;
      if (t.title.toLowerCase().includes(q)) score += 5;
      if (t.description.toLowerCase().includes(q)) score += 3;
      if (t.code.toLowerCase().includes(q)) score += 4;
      for (const step of t.content.steps) {
        if (step.body.toLowerCase().includes(q)) score += 1;
      }
      const keywords: [RegExp, number][] = [
        [/welcome|start here|orient/i, t.slug.includes("welcome") ? 6 : 0],
        [/navigat|sidebar|command center/i, t.slug.includes("navigating") ? 6 : 0],
        [/conversation|chat|ask/i, t.pageId === "jag.conversation" ? 6 : 0],
        [/inbox|watcher|alert/i, t.pageId === "jag.inbox" ? 6 : 0],
        [/decision/i, t.pageId === "jag.decisions" ? 6 : 0],
        [/listen/i, t.pageId === "jag.listening" ? 6 : 0],
        [/brief/i, t.pageId === "jag.briefings" ? 6 : 0],
        [/scenario/i, t.pageId === "jag.scenarios" ? 6 : 0],
        [/memory/i, t.pageId === "jag.memory" ? 6 : 0],
        [/strateg/i, t.pageId === "jag.strategy" ? 6 : 0],
      ];
      for (const [re, pts] of keywords) {
        if (re.test(q)) score += pts;
      }
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
  return scored.slice(0, 3);
}

export async function answerLearningCoach(input: {
  session: JagPlatformSession;
  question: string;
  activeOrganizationId: string | null;
  /** Pathname of the screen the user is on — server-validated mapping only. */
  pathname?: string | null;
}): Promise<JagLearnCoachAnswer> {
  const { session } = input;
  if (!canAccessJagLearningCenter(session)) {
    return {
      answer: "Learning Coach is not available for this account.",
      recommendedTutorialSlugs: [],
      deepLinks: [],
      evidenceSource: "jag_learn_catalog",
    };
  }

  const q = input.question.trim();
  if (!q) {
    return {
      answer:
        "Ask how to use The JAG™ — for example: “Where do I find Decisions?” or “What should I learn next?” Organizational intelligence questions belong in Conversation.",
      recommendedTutorialSlugs: ["welcome-to-the-jag"],
      deepLinks: [
        { label: "Learning Center", href: "/jag/learn" },
        { label: "Start Here", href: "/jag/learn/start" },
      ],
      evidenceSource: "jag_learn_catalog",
    };
  }

  // Refuse org-intelligence / finance / private-data style prompts.
  if (
    /(revenue|payroll|invoice amount|student grade|ssn|another user|founder.?only|internal release|repository|source code)/i.test(
      q
    )
  ) {
    return {
      answer:
        "I help with using The JAG™ product surfaces. I cannot expose financial records, executive intelligence payloads, private user data, or internal documentation. For organizational questions grounded in your evidence, use Executive Conversation.",
      recommendedTutorialSlugs: ["using-executive-conversation"],
      deepLinks: [
        { label: "Executive Conversation", href: "/jag/chat" },
        { label: "Learning Center", href: "/jag/learn" },
      ],
      evidenceSource: "jag_learn_catalog",
    };
  }

  const accessible = filterAccessibleTutorials(
    session,
    JAG_LEARN_TUTORIALS,
    input.activeOrganizationId
  );

  if (/what should i learn|recommend|next/i.test(q)) {
    const store = getLearningPersistence();
    const progress = await store.listProgress(boundLearningOwnerId(session));
    const done = new Set(
      progress.filter((p) => p.status === "completed").map((p) => p.tutorialId)
    );
    const unfinished = progress.find((p) => p.status === "in_progress");
    if (unfinished) {
      const t = accessible.find((x) => x.id === unfinished.tutorialId);
      if (t) {
        return {
          answer: `Resume “${t.title}” — you were ${unfinished.progressPercent}% through.`,
          recommendedTutorialSlugs: [t.slug],
          deepLinks: [
            {
              label: `Resume ${t.title}`,
              href: `/jag/learn/tutorials/${t.slug}`,
            },
          ],
          evidenceSource: "jag_learn_catalog",
        };
      }
    }
    const next = accessible.find((t) => !done.has(t.id));
    if (next) {
      return {
        answer: `I recommend “${next.title}” next (${next.estimatedMinutes} min).`,
        recommendedTutorialSlugs: [next.slug],
        deepLinks: [
          {
            label: next.title,
            href: `/jag/learn/tutorials/${next.slug}`,
          },
        ],
        evidenceSource: "jag_learn_catalog",
      };
    }
    return {
      answer:
        "You have completed the tutorials available for your current capabilities. Explore Help for page-specific guidance.",
      recommendedTutorialSlugs: [],
      deepLinks: [{ label: "Help", href: "/jag/learn/help" }],
      evidenceSource: "jag_learn_catalog",
    };
  }

  if (/this (page|screen)|where am i|explain (this|current)/i.test(q)) {
    const pageId = pageIdForPathname(input.pathname ?? "");
    const tutorial = accessible.find((t) => t.pageId === pageId);
    if (tutorial) {
      return {
        answer: `${tutorial.content.summary} Open the tutorial for a short walkthrough.`,
        recommendedTutorialSlugs: [tutorial.slug],
        deepLinks: [
          {
            label: tutorial.title,
            href: `/jag/learn/tutorials/${tutorial.slug}`,
          },
          {
            label: "Open feature",
            href: HREF_BY_PAGE[tutorial.pageId] ?? "/jag/learn",
          },
        ],
        evidenceSource: "jag_learn_catalog",
      };
    }
    return {
      answer:
        "This screen is part of The JAG™ Command Center. Open Learning Center for orientation tutorials available to your role and capabilities.",
      recommendedTutorialSlugs: ["welcome-to-the-jag"],
      deepLinks: [{ label: "Learning Center", href: "/jag/learn" }],
      evidenceSource: "jag_learn_catalog",
    };
  }

  const hits = matchTutorials(q, accessible);
  if (hits.length === 0) {
    return {
      answer:
        "I could not match that to a JAG product tutorial you are authorized to access. Try asking where to find Overview, Conversation, Inbox, Decisions, Listening, Briefings, Scenarios, Memory, or Strategy — or open Start Here.",
      recommendedTutorialSlugs: ["welcome-to-the-jag", "navigating-command-center"],
      deepLinks: [
        { label: "Start Here", href: "/jag/learn/start" },
        { label: "Tutorial library", href: "/jag/learn/tutorials" },
      ],
      evidenceSource: "jag_learn_catalog",
    };
  }

  const primary = hits[0]!;
  return {
    answer: `${primary.content.summary}\n\n${primary.content.steps[0]?.body ?? ""}`,
    recommendedTutorialSlugs: hits.map((h) => h.slug),
    deepLinks: hits.map((h) => ({
      label: h.title,
      href: `/jag/learn/tutorials/${h.slug}`,
    })),
    evidenceSource: "jag_learn_catalog",
  };
}

export function searchLearningHelp(input: {
  session: JagPlatformSession;
  query: string;
  activeOrganizationId: string | null;
}): {
  readonly results: readonly {
    readonly slug: string;
    readonly title: string;
    readonly excerpt: string;
    readonly href: string;
  }[];
} {
  if (!canAccessJagLearningCenter(input.session)) {
    return { results: [] };
  }
  const accessible = filterAccessibleTutorials(
    input.session,
    JAG_LEARN_TUTORIALS,
    input.activeOrganizationId
  );
  const q = input.query.trim().toLowerCase();
  if (!q) return { results: [] };
  return {
    results: accessible
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.content.summary.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map((t) => ({
        slug: t.slug,
        title: t.title,
        excerpt: t.description,
        href: `/jag/learn/tutorials/${t.slug}`,
      })),
  };
}
