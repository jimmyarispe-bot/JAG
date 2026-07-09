import {
  FOOTER_CYCLE_CLASS,
  FOOTER_LOGO_CLASS,
  FOOTER_PRESENTER_NAME_CLASS,
  FOOTER_PRESENTER_ROLE_CLASS,
  PRESENTATION_FOOTER,
  SCHOOL_LOGO_SRC,
} from "./tokens";

/** IMMUTABLE — identical on slides 2–15. Do not add text or redesign. */
export function PresentationFooter() {
  return (
    <div className={PRESENTATION_FOOTER}>
      <div className="flex items-center justify-center sm:justify-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SCHOOL_LOGO_SRC}
          alt="Marco Island Charter Middle School"
          className={FOOTER_LOGO_CLASS}
        />
      </div>

      <p className={`text-center ${FOOTER_CYCLE_CLASS}`}>
        Listening <span className="opacity-40">•</span> Learning <span className="opacity-40">•</span> Leading{" "}
        <span className="opacity-40">•</span> Improving
      </p>

      <div className="text-center sm:text-right">
        <p className={FOOTER_PRESENTER_NAME_CLASS}>Jimmy Arispe</p>
        <p className={FOOTER_PRESENTER_ROLE_CLASS}>Leadership Presentation</p>
      </div>
    </div>
  );
}
