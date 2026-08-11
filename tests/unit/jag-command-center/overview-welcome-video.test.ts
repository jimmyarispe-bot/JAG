/**
 * Overview Welcome video — durable JAG-001 surface (not HeyGen temp URLs).
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JagExecutiveOverview } from "@/components/jag/command-center/overview/JagExecutiveOverview";
import { JagWelcomeVideoSection } from "@/components/jag/command-center/overview/JagWelcomeVideoSection";
import { getCatalogTutorialBySlug } from "@/lib/jag-command-center/learning/catalog";
import { isTemporaryHeyGenVideoUrl } from "@/lib/jag-command-center/learning/media";
import type { JagExecutiveOverviewModel } from "@/lib/jag-command-center";

function emptyOverview(): JagExecutiveOverviewModel {
  return {
    organizationId: null,
    organizationName: null,
    organizationHealth: {
      status: "empty",
      explanation: "No school health bound.",
      primaryDrivers: [],
    },
    forecasts: {
      status: "empty",
      advisoryNotice: "Advisory only.",
      cards: [],
      explanation: "No forecasts.",
    },
    decisionExecution: {
      openDecisions: 0,
      assigned: 0,
      overdue: 0,
      completedThisWeek: 0,
      outcomeSuccessRate: null,
      outcomeReviewedCount: 0,
      href: "/jag/decisions",
    },
    priorities: [],
    executiveBrief: {
      status: "empty",
      explanation: "No brief.",
      strategicPriorities: [],
      criticalRisks: [],
      recommendedActions: [],
      href: "/jag/briefings",
    },
    capabilityPacks: [],
    domains: [],
    runtimeStatus: [],
    recentIntelligence: [],
    recommendedDecisions: [],
  };
}

describe("Overview Welcome video (JAG-001)", () => {
  it("catalog Welcome tutorial maps to durable JAG-001 media path", () => {
    const welcome = getCatalogTutorialBySlug("welcome-to-the-jag");
    expect(welcome).not.toBeNull();
    expect(welcome!.code).toBe("JAG-001");
    expect(welcome!.videoUrl).toBe("tutorials/JAG-001/mr-jag.mp4");
    expect(isTemporaryHeyGenVideoUrl(welcome!.videoUrl!)).toBe(false);
    expect(welcome!.videoUrl).not.toMatch(/heygen|Expires=|Signature=/i);
  });

  it("renders Welcome section front-and-center with signed playback URL", () => {
    const signed =
      "https://ybcpaffklggaloxhnqkl.supabase.co/storage/v1/object/sign/jag-learn-media/tutorials/JAG-001/mr-jag.mp4?token=1";
    const html = renderToStaticMarkup(
      createElement(JagWelcomeVideoSection, {
        videoUrl: signed,
      })
    );
    expect(html).toContain("Welcome to The JAG");
    expect(html).toContain("data-jag-overview-welcome-video");
    expect(html).toContain('data-jag-learn-video="ready"');
    expect(html).toMatch(
      new RegExp(
        `<video[^>]*\\ssrc="${signed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`
      )
    );
    expect(html).not.toContain("heygen");
    expect(html).toContain("/jag/learn/tutorials/welcome-to-the-jag");
  });

  it("passes overview welcomeVideoUrl through to the video element", () => {
    const signed =
      "https://ybcpaffklggaloxhnqkl.supabase.co/storage/v1/object/sign/jag-learn-media/tutorials/JAG-001/mr-jag.mp4?token=overview";
    const html = renderToStaticMarkup(
      createElement(JagExecutiveOverview, {
        model: emptyOverview(),
        welcomeVideoUrl: signed,
      })
    );
    expect(html).toContain("data-jag-overview-welcome-video");
    expect(html).toMatch(
      new RegExp(
        `<video[^>]*\\ssrc="${signed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`
      )
    );
  });

  it("places Welcome video above overview health content", () => {
    const html = renderToStaticMarkup(
      createElement(JagExecutiveOverview, {
        model: emptyOverview(),
        welcomeVideoUrl:
          "https://signed.example/tutorials/JAG-001/mr-jag.mp4?token=1",
      })
    );
    const welcomeIdx = html.indexOf("data-jag-overview-welcome-video");
    const healthIdx = html.indexOf("Organization Health");
    expect(welcomeIdx).toBeGreaterThan(-1);
    expect(healthIdx).toBeGreaterThan(-1);
    expect(welcomeIdx).toBeLessThan(healthIdx);
  });
});
