import {
  AlertCard,
  Breadcrumbs,
  EmptyState,
  ExperienceForm,
  FormField,
  LoadingState,
  PriorityCard,
  ProgressIndicator,
  SessionCard,
  StudentCard,
  SuccessBanner,
  AiRecommendationCard,
} from "@/components/experience-system";

/** Live reference for the Experience System™ — consumed by every workspace. */
export function ExperienceSystemShowcase() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <header>
        <Breadcrumbs items={[{ label: "Platform", href: "/dashboard" }, { label: "Experience System" }]} />
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Experience System™</h1>
        <p className="mt-1 text-sm text-slate-500">
          Shared navigation, page framework, cards, lists, panels, forms, feedback, and AI interaction — inherited by all workspaces.
        </p>
      </header>

      <SuccessBanner message="Experience System components loaded successfully." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StudentCard id="1" name="Alex Rivera" subtitle="Grade 4" />
        <SessionCard
          id="s1"
          timeDisplay="9:00 AM"
          title="Structured Literacy"
          subtitle="Section A · 1 student"
          status="scheduled"
          href="#"
        />
        <PriorityCard title="Deliver next session" description="9:00 AM — Structured Literacy" href="#" tone="brand" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AlertCard title="Documentation due" message="Session notes incomplete for Section B." severity="high" />
        <AiRecommendationCard
          recommendation={{
            id: "rec-1",
            title: "Review readiness before session",
            rationale: "One learner has an active IEP alert for today.",
            priority: "high",
            confidence: 88,
          }}
        />
      </section>

      <ProgressIndicator value={65} label="Workspace adoption" />

      <ExperienceForm ariaLabel="Sample form">
        <FormField label="Sample field" help="Inline help text demonstrates accessibility wiring.">
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Type here…" />
        </FormField>
      </ExperienceForm>

      <LoadingState label="Loading experience modules…" />
      <EmptyState title="No items" description="Empty states are standardized across workspaces." />
    </div>
  );
}
