import { COVER_FOOTER_CLASS } from "@/components/presentation/tokens";
import { PresentationFrame } from "@/components/presentation/PresentationFrame";

function Slide01CoverFooter() {
  return (
    <p className={COVER_FOOTER_CLASS}>
      Listening <span className="text-[#CBD5E1]">•</span> Learning{" "}
      <span className="text-[#CBD5E1]">•</span> Leading{" "}
      <span className="text-[#CBD5E1]">•</span> Improving
    </p>
  );
}

/** Template A — Cover (Slide 1 only). LOCKED — exact changes only when explicitly requested. */
export function Slide01Title() {
  return (
    <PresentationFrame coverFooter={<Slide01CoverFooter />}>
      <div className="-translate-y-8 flex w-full max-w-6xl flex-col items-center text-center sm:-translate-y-12">
        <h1 className="text-[64px] font-bold tracking-tight text-[#2F3DBD] lg:text-[72px] lg:leading-[1.05]">
          <span className="block">Marco Island</span>
          <span className="block">Charter Middle School</span>
        </h1>

        <div className="mt-14">
          <p className="text-[38px] font-semibold tracking-tight text-[#222222] sm:text-[42px]">Jimmy Arispe</p>
          <p className="text-[38px] font-semibold tracking-tight text-[#222222] sm:text-[42px]">
            Leadership Presentation
          </p>
        </div>

        <p className="mt-8 text-[22px] font-normal text-[#94A3B8] sm:text-[24px]">July 2026</p>
      </div>
    </PresentationFrame>
  );
}
