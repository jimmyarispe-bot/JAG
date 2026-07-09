import { PRESENTATION_CARD } from "./tokens";

interface QrCodePlaceholderProps {
  label?: string;
  className?: string;
}

export function QrCodePlaceholder({ label = "QR Code", className }: QrCodePlaceholderProps) {
  return (
    <div
      className={`relative flex aspect-square items-center justify-center ${PRESENTATION_CARD} ${className ?? ""}`}
      aria-label={`${label} placeholder`}
    >
      <svg viewBox="0 0 200 200" className="h-[78%] w-[78%] text-[#2F3DBD]/30" aria-hidden>
        <rect x="16" y="16" width="52" height="52" rx="6" fill="currentColor" opacity="0.5" />
        <rect x="28" y="28" width="28" height="28" rx="3" fill="white" />
        <rect x="132" y="16" width="52" height="52" rx="6" fill="currentColor" opacity="0.5" />
        <rect x="144" y="28" width="28" height="28" rx="3" fill="white" />
        <rect x="16" y="132" width="52" height="52" rx="6" fill="currentColor" opacity="0.5" />
        <rect x="28" y="144" width="28" height="28" rx="3" fill="white" />
        {[
          [84, 24, 10, 10],
          [104, 24, 10, 10],
          [124, 84, 10, 10],
          [84, 104, 10, 10],
          [104, 124, 10, 10],
          [144, 104, 10, 10],
          [164, 124, 10, 10],
          [84, 164, 10, 10],
          [124, 164, 10, 10],
          [164, 164, 10, 10],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill="currentColor" opacity="0.35" />
        ))}
      </svg>
      <span className="absolute bottom-4 text-[18px] font-medium tracking-[0.18em] text-[#64748B] uppercase">
        {label}
      </span>
    </div>
  );
}
