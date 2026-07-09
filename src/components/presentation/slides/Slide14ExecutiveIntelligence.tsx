import { ExecutiveIntelligenceHub } from "@/components/presentation/dashboard/ExecutiveIntelligenceHub";
import { TemplateBExecutiveContent } from "@/components/presentation/templates";
import { BODY_CLASS, SECTION_HEADING_CLASS } from "@/components/presentation/tokens";

export function Slide14ExecutiveIntelligence() {
  return (
    <TemplateBExecutiveContent eyebrow="Lead" title="Executive Intelligence">
      <p className={`max-w-2xl text-center ${BODY_CLASS} text-[#222222]/75`}>
        One dashboard showing every Intelligence module connected together.
      </p>

      <div className="mt-10 w-full sm:mt-12">
        <ExecutiveIntelligenceHub />
      </div>

      <p className={`mt-12 text-center ${SECTION_HEADING_CLASS} sm:mt-14`}>
        This becomes the <span className="text-[#2F3DBD]">&ldquo;operating system.&rdquo;</span>
      </p>
    </TemplateBExecutiveContent>
  );
}
