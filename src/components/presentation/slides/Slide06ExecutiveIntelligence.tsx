import { ExecutiveDashboardHero } from "@/components/presentation/dashboard/ExecutiveDashboardHero";
import { TemplateBExecutiveContent } from "@/components/presentation/templates";

const HERO_QUOTE =
  "Great leadership transforms information into insight, insight into action, and action into measurable improvement.";

const heroBand = (
  <>
    <div className="relative min-h-[58vh] w-full overflow-hidden sm:min-h-[62vh] lg:min-h-[68vh]">
      <ExecutiveDashboardHero />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/20"
        aria-hidden
      />
    </div>
  </>
);

export function Slide06ExecutiveIntelligence() {
  return (
    <TemplateBExecutiveContent
      hero={heroBand}
      title="Executive Intelligence Dashboard"
      subtitle="Learn · Lead · Improve"
      statement={HERO_QUOTE}
    >
      <span className="sr-only">Executive Intelligence Dashboard hero</span>
    </TemplateBExecutiveContent>
  );
}
