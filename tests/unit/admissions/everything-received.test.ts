import { describe, expect, it } from "vitest";

import { buildEverythingReceivedBody, everythingReceivedSubject } from "@/lib/admissions/finalizing/everything-received";
import { jimmySignatureHtml } from "@/lib/admissions/portal/jimmy-signature";

describe("the letter after the first payment", () => {
  const body = buildEverythingReceivedBody({
    parentNames: ["Rosy"],
    childName: "Ian",
    schoolName: "The Academy GA",
    leaderName: "Nina Gaddy",
  });

  it("names the campus in the subject", () => {
    expect(everythingReceivedSubject("The Academy GA")).toBe("We have received everything we require - The Academy GA");
  });

  it("says Jimmy's words and names the leader", () => {
    expect(body).toContain("Rosy,");
    expect(body).toContain("We have received Ian's signed contract and first tuition payment.");
    expect(body).toContain("We have received everything that we require, and Nina Gaddy, our school leader, will be in touch with you next.");
  });

  it("falls back when the leader's name is unknown", () => {
    const b = buildEverythingReceivedBody({ parentNames: [], childName: "Ian", schoolName: "The Academy FL", leaderName: null });
    expect(b).toContain("and our school leader will be in touch with you next.");
  });

  it("is signed with the Academy Way signature, campus under the network", () => {
    const sig = jimmySignatureHtml("The Academy GA");
    expect(body).toContain(sig);
    expect(sig.indexOf("The Academy Way Network of Schools")).toBeLessThan(sig.indexOf("The Academy GA"));
    expect(sig).toContain("CEO/Founder");
  });
});
