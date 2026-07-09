import { TemplateBExecutiveContent } from "@/components/presentation/templates";
import { BODY_CLASS, CLOSING_LOGO_CLASS, SCHOOL_LOGO_SRC } from "@/components/presentation/tokens";

export function Slide15Closing() {
  return (
    <TemplateBExecutiveContent
      narrow
      leading={
        <div className="mb-20 sm:mb-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SCHOOL_LOGO_SRC}
            alt="Marco Island Charter Middle School"
            className={CLOSING_LOGO_CLASS}
          />
        </div>
      }
      title="Leading the Next Chapter Together"
    >
      <p className={`${BODY_CLASS} font-medium text-[#64748B]`}>Jimmy Arispe</p>
    </TemplateBExecutiveContent>
  );
}
