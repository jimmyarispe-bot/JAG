import { JagSection } from "../JagSection";
import { JagServiceHealthBadge } from "./JagServiceHealthBadge";
import type { JagRuntimeServiceView } from "@/lib/jag-command-center";

export function JagRuntimeStatusSection({
  services,
}: {
  readonly services: readonly JagRuntimeServiceView[];
}) {
  return (
    <JagSection
      title="Runtime Status"
      description="Education intelligence services available to the Command Center. Status reflects real load/validation — not simulated uptime."
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {services.map((service) => (
          <article
            key={service.id}
            className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-[var(--jag-text)]">
                {service.label}
              </h3>
              <JagServiceHealthBadge health={service.health} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--jag-muted)]">
              {service.detail}
            </p>
          </article>
        ))}
      </div>
    </JagSection>
  );
}
