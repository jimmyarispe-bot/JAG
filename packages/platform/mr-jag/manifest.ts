/**
 * Mr. JAG™ capability descriptor — platform guide (not an industry pack).
 */

export const MR_JAG_ID = "mr-jag" as const;
export const MR_JAG_VERSION = "1.0.0" as const;

export const MR_JAG_MODULES = [
  "Avatar",
  "Academy",
  "Coach",
  "Help",
  "Knowledge",
  "Tutorials",
  "Walkthroughs",
  "Voice",
  "Personas",
] as const;

export const MR_JAG_DESCRIPTOR = Object.freeze({
  id: MR_JAG_ID,
  name: "Mr. JAG™" as const,
  version: MR_JAG_VERSION,
  type: "platform-capability" as const,
  description:
    "Operational intelligence guide for onboarding, learning, contextual help, coaching, and walkthroughs across JAG products.",
  modules: MR_JAG_MODULES,
});
