/**
 * Authoritative JAG-native tutorial catalog (Phase 1).
 * Mirrors supabase/migrations/216_jag_learning_center.sql seed.
 * Does NOT include AcademyOS aos.* content.
 */

import type { JagLearnTutorial, JagLearnWalkthrough } from "./types";

function tutorial(
  partial: Omit<JagLearnTutorial, "product" | "isActive" | "difficulty"> & {
    difficulty?: JagLearnTutorial["difficulty"];
  }
): JagLearnTutorial {
  return Object.freeze({
    product: "jag",
    isActive: true,
    difficulty: partial.difficulty ?? "beginner",
    ...partial,
  });
}

export const JAG_LEARN_TUTORIALS: readonly JagLearnTutorial[] = Object.freeze([
  tutorial({
    id: "00000000-0000-4000-8000-000000000001",
    slug: "welcome-to-the-jag",
    code: "JAG-001",
    title: "Welcome to The JAG",
    description:
      "Orient to The JAG™ as your organizational intelligence command center.",
    category: "orientation",
    estimatedMinutes: 2,
    requiredCapabilityId: null,
    videoUrl: "tutorials/JAG-001/mr-jag.mp4",
    walkthroughId: "wt.jag.welcome",
    pageId: "jag.overview",
    sortOrder: 10,
    content: {
      summary:
        "The JAG™ is your organizational intelligence command center.",
      steps: [
        {
          title: "What The JAG is",
          body: "The JAG™ composes executive intelligence from identity, role, permissions, evidence, and organizational state — not a second portal or LMS.",
        },
        {
          title: "What you will learn",
          body: "Use Learning Center to understand Overview, Conversation, Inbox, Decisions, Listening, Briefings, Scenarios, Memory, and Strategy.",
        },
        {
          title: "Stay in Learning Center",
          body: "Return anytime from Learn in the Command Center navigation. Executive Onboarding (/jag/onboarding) is platform provisioning and is separate.",
        },
      ],
    },
  }),
  tutorial({
    id: "00000000-0000-4000-8000-000000000002",
    slug: "navigating-command-center",
    code: "JAG-002",
    title: "Navigating Your JAG Command Center",
    description:
      "Learn the Command Center sidebar and how experiences are composed.",
    category: "orientation",
    estimatedMinutes: 3,
    requiredCapabilityId: null,
    videoUrl: "tutorials/JAG-002/mr-jag.mp4",
    walkthroughId: "wt.jag.navigation",
    pageId: "jag.overview",
    sortOrder: 20,
    content: {
      summary: "Navigate The JAG™ Command Center with confidence.",
      steps: [
        {
          title: "Sidebar destinations",
          body: "Primary navigation lists Overview, Learn, and intelligence surfaces enabled for your workspace.",
        },
        {
          title: "Capability gates",
          body: "Items appear when your organization has the capability enabled. You will not see destinations you are not authorized to use.",
        },
        {
          title: "Settings vs Learning",
          body: "Settings covers brand and account chrome. Learn covers product orientation and tutorials — not org provisioning.",
        },
      ],
    },
  }),
  tutorial({
    id: "00000000-0000-4000-8000-000000000003",
    slug: "using-executive-conversation",
    code: "JAG-003",
    title: "Using Executive Conversation",
    description:
      "Ask evidence-backed executive questions — not a general chatbot.",
    category: "essentials",
    estimatedMinutes: 3,
    requiredCapabilityId: "jag.intelligence.conversation",
    videoUrl: "tutorials/JAG-003/mr-jag.mp4",
    walkthroughId: "wt.jag.conversation",
    pageId: "jag.conversation",
    sortOrder: 30,
    content: {
      summary: "Executive Conversation answers from bound evidence.",
      steps: [
        {
          title: "Open Conversation",
          body: "Use Conversation in the sidebar (/jag/chat). It is evidence-backed executive Q&A, not a chatbot and not the JAG Coach.",
        },
        {
          title: "Grounded answers",
          body: "Answers cite organizational signals when available. Unbound or empty signals are stated explicitly — the system does not invent metrics.",
        },
        {
          title: "When to use Coach instead",
          body: "For “how do I use JAG?” and navigation help, open Learn → AI Coach. Keep Conversation for organizational intelligence questions.",
        },
      ],
    },
  }),
  tutorial({
    id: "00000000-0000-4000-8000-000000000004",
    slug: "understanding-your-inbox",
    code: "JAG-004",
    title: "Understanding Your Inbox",
    description: "Review watcher alerts and actionable executive signals.",
    category: "essentials",
    estimatedMinutes: 2,
    requiredCapabilityId: "jag.intelligence.watchers",
    videoUrl: "tutorials/JAG-004/mr-jag.mp4",
    walkthroughId: "wt.jag.inbox",
    pageId: "jag.inbox",
    sortOrder: 40,
    content: {
      summary: "Inbox surfaces watcher-driven executive attention.",
      steps: [
        {
          title: "Open Inbox",
          body: "Inbox (/jag/inbox) lists watcher alerts and attention items for your workspace.",
        },
        {
          title: "Act on signals",
          body: "Use inbox items as entry points into Decisions, Listening, or other intelligence surfaces — it does not invent alerts without watchers.",
        },
      ],
    },
  }),
  tutorial({
    id: "00000000-0000-4000-8000-000000000005",
    slug: "decision-center",
    code: "JAG-005",
    title: "Decision Center",
    description: "Track and advance organizational decisions with evidence.",
    category: "essentials",
    estimatedMinutes: 3,
    requiredCapabilityId: "jag.decisions.center",
    videoUrl: "tutorials/JAG-005/mr-jag.mp4",
    walkthroughId: "wt.jag.decisions",
    pageId: "jag.decisions",
    sortOrder: 50,
    content: {
      summary: "Decision Center holds decision records and follow-through.",
      steps: [
        {
          title: "Open Decision Center",
          body: "Decisions (/jag/decisions) lists decision records for the active organization.",
        },
        {
          title: "Detail and evidence",
          body: "Open a decision to review status, related evidence, and next actions as implemented in production — empty states mean no fabricated decisions.",
        },
      ],
    },
  }),
  tutorial({
    id: "00000000-0000-4000-8000-000000000006",
    slug: "listening-and-intelligence",
    code: "JAG-006",
    title: "Listening & Listening Intelligence",
    description: "Run listening instruments and review intelligence outputs.",
    category: "essentials",
    estimatedMinutes: 3,
    requiredCapabilityId: "jag.intelligence.listening",
    videoUrl: "tutorials/JAG-006/mr-jag.mp4",
    walkthroughId: "wt.jag.listening",
    pageId: "jag.listening",
    sortOrder: 60,
    content: {
      summary:
        "Listening captures stakeholder signal; Intelligence analyzes it.",
      steps: [
        {
          title: "Listening home",
          body: "Listening (/jag/listening) manages campaigns, instruments, and versions for structured listening.",
        },
        {
          title: "Listening Intelligence",
          body: "Listening Intelligence (/jag/listening/intelligence) surfaces analysis runs and signals when data exists — it does not invent segment insights.",
        },
      ],
    },
  }),
  tutorial({
    id: "00000000-0000-4000-8000-000000000007",
    slug: "executive-briefings",
    code: "JAG-007",
    title: "Executive Briefings",
    description:
      "Generate and review executive briefings from organizational signals.",
    category: "essentials",
    estimatedMinutes: 3,
    requiredCapabilityId: "jag.intelligence.briefings",
    videoUrl: "tutorials/JAG-007/mr-jag.mp4",
    walkthroughId: "wt.jag.briefings",
    pageId: "jag.briefings",
    sortOrder: 70,
    content: {
      summary: "Briefings assemble executive-ready summaries.",
      steps: [
        {
          title: "Open Briefings",
          body: "Briefings (/jag/briefings) lists briefing artifacts for your workspace.",
        },
        {
          title: "Review a briefing",
          body: "Open a briefing to read the structured summary. Content reflects available evidence — empty workspaces show empty states.",
        },
      ],
    },
  }),
  tutorial({
    id: "00000000-0000-4000-8000-000000000008",
    slug: "scenario-planner",
    code: "JAG-008",
    title: "Scenario Planner",
    description:
      "Explore hypothetical organizational scenarios without inventing facts.",
    category: "essentials",
    estimatedMinutes: 3,
    requiredCapabilityId: "jag.intelligence.scenarios",
    videoUrl: "tutorials/JAG-008/mr-jag.mp4",
    walkthroughId: "wt.jag.scenarios",
    pageId: "jag.scenarios",
    sortOrder: 80,
    content: {
      summary: "Scenario Planner models hypothetical changes.",
      steps: [
        {
          title: "Open Scenarios",
          body: "Scenario Planner (/jag/scenarios) lists available scenario templates and runs.",
        },
        {
          title: "Interpret carefully",
          body: "Scenarios are planning aids. They do not replace evidence-backed Conversation answers about current state.",
        },
      ],
    },
  }),
  tutorial({
    id: "00000000-0000-4000-8000-000000000009",
    slug: "memory",
    code: "JAG-009",
    title: "Memory",
    description:
      "Review retained organizational memory used by intelligence surfaces.",
    category: "essentials",
    estimatedMinutes: 2,
    requiredCapabilityId: "jag.intelligence.memory",
    videoUrl: "tutorials/JAG-009/mr-jag.mp4",
    walkthroughId: "wt.jag.memory",
    pageId: "jag.memory",
    sortOrder: 90,
    content: {
      summary: "Memory retains organizational context for intelligence.",
      steps: [
        {
          title: "Open Memory",
          body: "Memory (/jag/memory) shows retained organizational memory entries available to the workspace.",
        },
        {
          title: "How it is used",
          body: "Other intelligence surfaces may reference memory. Empty memory means nothing has been retained yet — not an error.",
        },
      ],
    },
  }),
  tutorial({
    id: "00000000-0000-4000-8000-000000000010",
    slug: "strategy",
    code: "JAG-010",
    title: "Strategy",
    description:
      "Review mission, pillars, and strategic intelligence for the organization.",
    category: "essentials",
    estimatedMinutes: 3,
    requiredCapabilityId: "jag.intelligence.strategy",
    videoUrl: "tutorials/JAG-010/mr-jag.mp4",
    walkthroughId: "wt.jag.strategy",
    pageId: "jag.strategy",
    sortOrder: 100,
    content: {
      summary: "Strategy holds mission and strategic structure.",
      steps: [
        {
          title: "Open Strategy",
          body: "Strategy (/jag/strategy) presents mission, pillars, and related strategic intelligence for the active organization.",
        },
        {
          title: "Keep it evidence-aligned",
          body: "Strategy reflects configured organizational intent. Pair it with Decisions and Briefings for execution follow-through.",
        },
      ],
    },
  }),
]);

export const JAG_LEARN_WALKTHROUGHS: readonly JagLearnWalkthrough[] =
  Object.freeze([
    {
      id: "wt.jag.welcome",
      pageId: "jag.overview",
      title: "Welcome orientation",
      steps: [
        {
          id: "s1",
          title: "Command Center",
          body: "This is your JAG Command Center shell — navigation on the left, work in the main panel.",
          targetSelector: "[data-jag-nav='overview']",
        },
        {
          id: "s2",
          title: "Learn",
          body: "Open Learn anytime to continue tutorials and ask the JAG Coach about product usage.",
          targetSelector: "[data-jag-nav='learn']",
        },
      ],
    },
    {
      id: "wt.jag.navigation",
      pageId: "jag.overview",
      title: "Navigation basics",
      steps: [
        {
          id: "s1",
          title: "Sidebar",
          body: "Use the sidebar to move between Overview and intelligence surfaces you are authorized to use.",
          targetSelector: "#jag-command-nav",
        },
        {
          id: "s2",
          title: "Learn hub",
          body: "Learning Center is always available from Learn — separate from platform Onboarding.",
          targetSelector: "[data-jag-nav='learn']",
        },
      ],
    },
    {
      id: "wt.jag.conversation",
      pageId: "jag.conversation",
      title: "Conversation walkthrough",
      steps: [
        {
          id: "s1",
          title: "Conversation",
          body: "Open Conversation for evidence-backed executive questions about your organization.",
          targetSelector: "[data-jag-nav='chat']",
        },
      ],
    },
    {
      id: "wt.jag.inbox",
      pageId: "jag.inbox",
      title: "Inbox walkthrough",
      steps: [
        {
          id: "s1",
          title: "Inbox",
          body: "Inbox lists watcher alerts for your workspace.",
          targetSelector: "[data-jag-nav='inbox']",
        },
      ],
    },
    {
      id: "wt.jag.decisions",
      pageId: "jag.decisions",
      title: "Decisions walkthrough",
      steps: [
        {
          id: "s1",
          title: "Decision Center",
          body: "Open Decisions to review decision records.",
          targetSelector: "[data-jag-nav='decisions']",
        },
      ],
    },
    {
      id: "wt.jag.listening",
      pageId: "jag.listening",
      title: "Listening walkthrough",
      steps: [
        {
          id: "s1",
          title: "Listening",
          body: "Listening manages campaigns and instruments.",
          targetSelector: "[data-jag-nav='listening']",
        },
        {
          id: "s2",
          title: "Listening Intelligence",
          body: "Listening Intelligence shows analysis when available.",
          targetSelector: "[data-jag-nav='listening-intelligence']",
        },
      ],
    },
    {
      id: "wt.jag.briefings",
      pageId: "jag.briefings",
      title: "Briefings walkthrough",
      steps: [
        {
          id: "s1",
          title: "Briefings",
          body: "Open Briefings for executive briefing artifacts.",
          targetSelector: "[data-jag-nav='briefings']",
        },
      ],
    },
    {
      id: "wt.jag.scenarios",
      pageId: "jag.scenarios",
      title: "Scenarios walkthrough",
      steps: [
        {
          id: "s1",
          title: "Scenario Planner",
          body: "Open Scenarios to explore planning templates.",
          targetSelector: "[data-jag-nav='scenarios']",
        },
      ],
    },
    {
      id: "wt.jag.memory",
      pageId: "jag.memory",
      title: "Memory walkthrough",
      steps: [
        {
          id: "s1",
          title: "Memory",
          body: "Open Memory to review retained organizational context.",
          targetSelector: "[data-jag-nav='memory']",
        },
      ],
    },
    {
      id: "wt.jag.strategy",
      pageId: "jag.strategy",
      title: "Strategy walkthrough",
      steps: [
        {
          id: "s1",
          title: "Strategy",
          body: "Open Strategy to review mission and strategic structure.",
          targetSelector: "[data-jag-nav='strategy']",
        },
      ],
    },
  ]);

export function getCatalogTutorialBySlug(
  slug: string
): JagLearnTutorial | null {
  return JAG_LEARN_TUTORIALS.find((t) => t.slug === slug) ?? null;
}

export function getCatalogTutorialById(id: string): JagLearnTutorial | null {
  return JAG_LEARN_TUTORIALS.find((t) => t.id === id) ?? null;
}

export function getWalkthroughById(id: string): JagLearnWalkthrough | null {
  return JAG_LEARN_WALKTHROUGHS.find((w) => w.id === id) ?? null;
}

/** Map pathname → pageId for contextual help. */
export function pageIdForPathname(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/jag" || path === "/jag/") return "jag.overview";
  if (path.startsWith("/jag/chat")) return "jag.conversation";
  if (path.startsWith("/jag/inbox")) return "jag.inbox";
  if (path.startsWith("/jag/decisions")) return "jag.decisions";
  if (path.startsWith("/jag/listening/intelligence")) return "jag.listening";
  if (path.startsWith("/jag/listening")) return "jag.listening";
  if (path.startsWith("/jag/briefings")) return "jag.briefings";
  if (path.startsWith("/jag/scenarios")) return "jag.scenarios";
  if (path.startsWith("/jag/memory")) return "jag.memory";
  if (path.startsWith("/jag/strategy")) return "jag.strategy";
  if (path.startsWith("/jag/learn")) return "jag.learn";
  if (path.startsWith("/jag/graph")) return "jag.graph";
  return null;
}

export function tutorialForPageId(pageId: string): JagLearnTutorial | null {
  return (
    JAG_LEARN_TUTORIALS.find((t) => t.pageId === pageId && t.category === "essentials") ??
    JAG_LEARN_TUTORIALS.find((t) => t.pageId === pageId) ??
    null
  );
}
