/**
 * JAG Learning Center — Phase 2A video infrastructure tests.
 */

import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JagLearningVideo } from "@/components/jag/command-center/learn/JagLearningVideo";
import {
  JAG_LEARN_INSTRUCTOR_ID,
  JAG_LEARN_MEDIA_BUCKET,
  JAG_LEARN_TUTORIALS,
  buildJagLearnMediaPath,
  canAccessJagLearningCenter,
  canAccessTutorial,
  createJagLearnMediaStorage,
  ensureJagWalkthroughsRegistered,
  getCatalogTutorialBySlug,
  getJagWalkthrough,
  isAllowedJagLearnMediaUrl,
  isJagLearnMediaPath,
  isTemporaryHeyGenVideoUrl,
  resolveJagLearnCatalogVideoUrl,
  resolveJagLearnVideoPlayback,
  resetJagWalkthroughRegistrationForTests,
  setJagLearnMediaStorageFactoryForTests,
} from "@/lib/jag-command-center/learning";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { resetMrJagStoreForTests } from "@mr-jag";

function session(
  overrides: Partial<JagPlatformSession> = {}
): JagPlatformSession {
  return {
    userId: "user-learn-video-1",
    email: "learn-video@test.example",
    displayName: "Learn Video User",
    role: "ORG_OWNER",
    authority: "organization",
    organizationId: "org-learn-video-1",
    issuedAt: new Date().toISOString(),
    exp: Date.now() + 60 * 60 * 1000,
    ...overrides,
  };
}

afterEach(() => {
  setJagLearnMediaStorageFactoryForTests(null);
});

describe("JAG Learning video infrastructure", () => {
  it("maps all ten tutorials to durable media paths (never HeyGen temp URLs)", () => {
    expect(JAG_LEARN_TUTORIALS).toHaveLength(10);
    for (const t of JAG_LEARN_TUTORIALS) {
      expect(t.videoUrl).toBe(`tutorials/${t.code}/mr-jag.mp4`);
      expect(isJagLearnMediaPath(t.videoUrl)).toBe(true);
      expect(isTemporaryHeyGenVideoUrl(t.videoUrl!)).toBe(false);
      expect(t.videoUrl).not.toMatch(/Expires=|Signature=|Key-Pair-Id=/i);
      expect(t.videoUrl).not.toContain("heygen");
    }
  });

  it("resolves JAG-001 and JAG-010 media refs to signed URLs at runtime", async () => {
    setJagLearnMediaStorageFactoryForTests(() =>
      createJagLearnMediaStorage({
        storage: {
          from: (bucket) => {
            expect(bucket).toBe("jag-learn-media");
            return {
              createSignedUrl: async (path, expiresIn) => ({
                data: {
                  signedUrl: `https://signed.example/${path}?e=${expiresIn}`,
                },
                error: null,
              }),
              list: async () => ({ data: [], error: null }),
              upload: async () => ({ data: { path: "" }, error: null }),
            };
          },
        },
      })
    );

    const one = await resolveJagLearnCatalogVideoUrl(
      "tutorials/JAG-001/mr-jag.mp4"
    );
    const ten = await resolveJagLearnCatalogVideoUrl(
      "tutorials/JAG-010/mr-jag.mp4"
    );
    expect(one).toBe(
      "https://signed.example/tutorials/JAG-001/mr-jag.mp4?e=3600"
    );
    expect(ten).toBe(
      "https://signed.example/tutorials/JAG-010/mr-jag.mp4?e=3600"
    );
  });

  it("never persists or serves temporary HeyGen URLs", async () => {
    const heygen =
      "https://files2.heygen.ai/aws_pacific/avatar_tmp/x/y.mp4?Expires=1&Signature=abc&Key-Pair-Id=K";
    expect(isTemporaryHeyGenVideoUrl(heygen)).toBe(true);
    expect(await resolveJagLearnCatalogVideoUrl(heygen)).toBeNull();
    const playback = resolveJagLearnVideoPlayback({ videoUrl: heygen });
    expect(playback.kind).toBe("unavailable");
  });

  it("rejects invalid tutorial media references safely", async () => {
    expect(isJagLearnMediaPath("../secret")).toBe(false);
    expect(isJagLearnMediaPath("tutorials/evil/mr-jag.mp4")).toBe(false);
    expect(await resolveJagLearnCatalogVideoUrl("tutorials/../x")).toBeNull();
    expect(
      await resolveJagLearnCatalogVideoUrl("javascript:alert(1)")
    ).toBeNull();
  });

  it("resolves missing video as unavailable fallback", () => {
    const playback = resolveJagLearnVideoPlayback({
      videoUrl: null,
      title: "Welcome to The JAG",
    });
    expect(playback.kind).toBe("unavailable");
    if (playback.kind === "unavailable") {
      expect(playback.reason).toBe("missing");
      expect(playback.instructorId).toBe(JAG_LEARN_INSTRUCTOR_ID);
    }
  });

  it("resolves absolute https video URL with optional captions and poster", () => {
    const playback = resolveJagLearnVideoPlayback({
      videoUrl: "https://cdn.example.com/jag/JAG-001.mp4",
      captionsUrl: "https://cdn.example.com/jag/JAG-001.vtt",
      posterUrl: "https://cdn.example.com/jag/JAG-001.jpg",
      title: "Welcome to The JAG",
    });
    expect(playback.kind).toBe("ready");
    if (playback.kind === "ready") {
      expect(playback.videoUrl).toContain("JAG-001.mp4");
      expect(playback.captionsUrl).toContain(".vtt");
      expect(playback.posterUrl).toContain(".jpg");
      expect(playback.instructorId).toBe("mr-jag");
    }
  });

  it("rejects non-http(s) video URLs and raw storage paths in the player", () => {
    expect(isAllowedJagLearnMediaUrl("javascript:alert(1)")).toBe(false);
    expect(
      resolveJagLearnVideoPlayback({
        videoUrl: "javascript:alert(1)",
      }).kind
    ).toBe("unavailable");
    expect(
      resolveJagLearnVideoPlayback({
        videoUrl: "tutorials/JAG-001/mr-jag.mp4",
      }).kind
    ).toBe("unavailable");
  });

  it("renders fallback when videoUrl is absent", () => {
    const html = renderToStaticMarkup(
      createElement(JagLearningVideo, {
        videoUrl: null,
        title: "Welcome to The JAG",
      })
    );
    expect(html).toContain('data-jag-learn-video="unavailable"');
    expect(html).toContain("video coming soon");
    expect(html).not.toContain("<video");
  });

  it("renders native video when URL exists", () => {
    const html = renderToStaticMarkup(
      createElement(JagLearningVideo, {
        videoUrl: "https://cdn.example.com/jag/JAG-001.mp4",
        captionsUrl: "https://cdn.example.com/jag/JAG-001.vtt",
        posterUrl: "https://cdn.example.com/jag/JAG-001.jpg",
        title: "Welcome to The JAG",
      })
    );
    expect(html).toContain('data-jag-learn-video="ready"');
    expect(html).toContain("<video");
    // URL must be on the <video> element itself (not only a nested <source>).
    expect(html).toMatch(
      /<video[^>]*\ssrc="https:\/\/cdn\.example\.com\/jag\/JAG-001\.mp4"/
    );
    expect(html).toContain('kind="captions"');
    expect(html).toContain("poster=");
    expect(html).not.toContain("autoplay");
    expect(html).toContain("Mr. JAG");
  });

  it("assigns a Supabase signed URL to the video element src attribute", () => {
    const signed =
      "https://ybcpaffklggaloxhnqkl.supabase.co/storage/v1/object/sign/jag-learn-media/tutorials/JAG-001/mr-jag.mp4?token=test";
    const html = renderToStaticMarkup(
      createElement(JagLearningVideo, {
        videoUrl: signed,
        title: "Welcome to The JAG",
      })
    );
    expect(html).toContain('data-jag-learn-video="ready"');
    expect(html).toMatch(
      new RegExp(
        `<video[^>]*\\ssrc="${signed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`
      )
    );
  });

  it("builds media paths under the dedicated JAG Learning bucket contract", () => {
    expect(JAG_LEARN_MEDIA_BUCKET).toBe("jag-learn-media");
    expect(
      buildJagLearnMediaPath({
        tutorialCode: "JAG-001",
        fileName: "mr-jag.mp4",
      })
    ).toBe("tutorials/JAG-001/mr-jag.mp4");
    expect(() =>
      buildJagLearnMediaPath({
        tutorialCode: "../secret",
        fileName: "x.mp4",
      })
    ).toThrow(/Invalid/);
  });

  it("mints signed URLs through Learning media storage without AcademyOS imports", async () => {
    const storage = createJagLearnMediaStorage({
      storage: {
        from: (bucket) => {
          expect(bucket).toBe("jag-learn-media");
          return {
            createSignedUrl: async (path, expiresIn) => ({
              data: {
                signedUrl: `https://signed.example/${path}?e=${expiresIn}`,
              },
              error: null,
            }),
            list: async () => ({ data: [], error: null }),
            upload: async () => ({ data: { path: "" }, error: null }),
          };
        },
      },
    });
    const url = await storage.createSignedUrl({
      path: "tutorials/JAG-001/mr-jag.mp4",
      expiresInSeconds: 120,
    });
    expect(url).toContain("tutorials/JAG-001/mr-jag.mp4");
  });

  it("keeps capability gates, walkthroughs, and AcademyOS isolation intact", () => {
    resetMrJagStoreForTests();
    resetJagWalkthroughRegistrationForTests();

    expect(canAccessJagLearningCenter(null)).toBe(false);
    expect(canAccessJagLearningCenter(session())).toBe(true);

    const welcome = getCatalogTutorialBySlug("welcome-to-the-jag")!;
    expect(welcome.videoUrl).toBe("tutorials/JAG-001/mr-jag.mp4");
    expect(canAccessTutorial(session(), welcome, session().organizationId)).toBe(
      true
    );

    const convo = getCatalogTutorialBySlug("using-executive-conversation")!;
    expect(convo.requiredCapabilityId).toBe("jag.intelligence.conversation");
    expect(
      canAccessTutorial(
        session({ organizationId: null, authority: "organization" }),
        convo,
        null
      )
    ).toBe(false);

    ensureJagWalkthroughsRegistered();
    expect(getJagWalkthrough("wt.jag.welcome")?.pageId).toBe("jag.overview");
    expect(JAG_LEARN_TUTORIALS.every((t) => t.product === "jag")).toBe(true);
    expect(JAG_LEARN_TUTORIALS.every((t) => !t.pageId.startsWith("aos."))).toBe(
      true
    );
  });
});
