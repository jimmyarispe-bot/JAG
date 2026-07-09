import Link from "next/link";
import {
  AiRecommendationCard,
  AlertCard,
  Breadcrumbs,
  CompetencyCard,
  ContextNavigation,
  EmptyState,
  EvidenceCard,
  NotesPanel,
  PageHeader,
  ProgressIndicator,
  SuccessBanner,
  TimelinePanel,
  WarningBanner,
  type XesTimelineEntry,
} from "@/components/experience-system";
import type { InstructionDeliveryContext } from "@/lib/instruction/delivery-context";
import type { SessionCloseoutSummary } from "@/lib/instruction/session-closeout";

function LaunchItem({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${
        ok ? "border-emerald-200 bg-emerald-50/80 text-emerald-900" : "border-amber-200 bg-amber-50/80 text-amber-900"
      }`}
    >
      <p className="font-medium">{label}</p>
      {detail && <p className="mt-0.5 text-xs opacity-80">{detail}</p>}
    </div>
  );
}

export function InstructionLaunchBar({ ctx }: { ctx: InstructionDeliveryContext }) {
  return (
    <section aria-label="Instruction launch" className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Instruction launch</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <LaunchItem label="Today's lesson" ok detail={ctx.courseName} />
        <LaunchItem
          label="Learner profile"
          ok={Boolean(ctx.student.id)}
          detail={`${ctx.student.firstName} ${ctx.student.lastName}`}
        />
        <LaunchItem
          label="Competency targets"
          ok={Boolean(ctx.activeCompetency)}
          detail={ctx.activeCompetency?.title ?? "No active competency"}
        />
        <LaunchItem
          label="Prerequisites"
          ok={ctx.prerequisiteStatus.ok}
          detail={ctx.prerequisiteStatus.ok ? "Chain satisfied" : `Missing ${ctx.prerequisiteStatus.missing.length}`}
        />
        <LaunchItem
          label="Accommodations"
          ok={ctx.accommodations.length > 0}
          detail={ctx.accommodations.length ? `${ctx.accommodations.length} on file` : "None required"}
        />
        <LaunchItem
          label="Recommendations"
          ok={ctx.engineRecommendations.length > 0 || Boolean(ctx.pajRecommendations)}
          detail={`${ctx.engineRecommendations.length} engine · PAJ ${ctx.pajRecommendations ? "yes" : "—"}`}
        />
        <LaunchItem
          label="Resources"
          ok={ctx.lessonPlans.length > 0 || ctx.knowledgeAssets.length > 0}
          detail={`${ctx.lessonPlans.length} plans · ${ctx.knowledgeAssets.length} knowledge`}
        />
      </div>
    </section>
  );
}

export function InstructionDeliveryPanel({
  ctx,
  children,
}: {
  ctx: InstructionDeliveryContext;
  children: React.ReactNode;
}) {
  const prereqTimeline: XesTimelineEntry[] = ctx.prerequisiteStatus.chain.map((item, index) => ({
    id: item.competencyKey,
    title: item.title,
    subtitle: item.competencyKey,
    timestamp: new Date().toISOString(),
    status: item.met ? "complete" : index === ctx.prerequisiteStatus.chain.length - 1 ? "current" : "warning",
  }));

  const masteryPct = ctx.competencyProgress
    ? Math.min(100, (ctx.competencyProgress.mastery_level / 4) * 100)
    : 0;

  const masteryLevel =
    (ctx.competencyProgress?.mastery_level ?? 0) >= 3
      ? "proficient"
      : (ctx.competencyProgress?.mastery_level ?? 0) >= 2
        ? "developing"
        : "emerging";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Instruction panel</h2>
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Lesson objective</h3>
              {ctx.lessonObjectives.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {ctx.lessonObjectives.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Add objectives in the lesson workspace below.</p>
              )}
            </div>

            {ctx.activeCompetency && (
              <CompetencyCard
                title={ctx.activeCompetency.title}
                domain={ctx.activeCompetency.learningDomainKey.replace(/_/g, " ")}
                description={ctx.activeCompetency.purpose}
                progress={masteryPct}
                masteryLevel={masteryLevel}
              />
            )}

            {prereqTimeline.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Prerequisite chain</h3>
                <div className="mt-2">
                  <TimelinePanel variant="progress" entries={prereqTimeline} />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-700">Learner evidence</h3>
              {ctx.platformEvidence.length || ctx.sessionArtifacts.length ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ctx.sessionArtifacts.slice(0, 4).map((a) => (
                    <EvidenceCard
                      key={String(a.id)}
                      title={String(a.title)}
                      artifactType={String(a.artifact_type)}
                      createdAt={String(a.created_at)}
                    />
                  ))}
                  {ctx.platformEvidence.slice(0, 2).map((e) => (
                    <EvidenceCard
                      key={e.id}
                      title={e.evidence_type_key}
                      artifactType={e.status}
                      createdAt={e.captured_at}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No evidence yet for this competency." description="Capture artifacts during instruction." />
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700">AI instructional recommendations</h3>
              <div className="mt-2 space-y-3">
                {ctx.engineRecommendations.slice(0, 2).map((rec) => (
                  <AiRecommendationCard
                    key={rec.id}
                    recommendation={{
                      ...rec,
                      confidence: rec.priority === "high" ? 88 : 70,
                      knowledge: ctx.knowledgeAssets.map((k) => ({
                        id: k.nodeKey,
                        title: k.title,
                        layerKind: k.kind,
                      })),
                    }}
                  />
                ))}
                {ctx.pajRecommendations?.learningRecommendation && (
                  <AlertCard
                    title="PAJ learning recommendation"
                    message={ctx.pajRecommendations.learningRecommendation.label}
                    severity="medium"
                  />
                )}
                {!ctx.engineRecommendations.length && !ctx.pajRecommendations && (
                  <p className="text-sm text-slate-500">No recommendations at launch — record evidence to refresh.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-200 bg-brand-50/30 p-5">
          <h2 className="font-semibold text-slate-900">During instruction</h2>
          <p className="mt-1 text-sm text-slate-600">
            Record observations, evidence, competency progress, artifacts, interventions, and follow-up.
          </p>
          <div className="mt-4 space-y-6">{children}</div>
        </section>
      </div>

      <aside className="space-y-4">
        <NotesPanel title="Teacher notes">
          {ctx.teacherNotes.length ? (
            <ul className="space-y-2 text-sm text-slate-600">
              {ctx.teacherNotes.slice(0, 5).map((n) => (
                <li key={n.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  <p className="line-clamp-2 text-xs">{n.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No notes yet for this learner.</p>
          )}
        </NotesPanel>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Accommodations</h3>
          {ctx.accommodations.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
              {ctx.accommodations.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No IEP/504 accommodations on file.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Parent communication reminders</h3>
          {ctx.parentReminders.length ? (
            <ul className="mt-2 space-y-2 text-sm text-amber-800">
              {ctx.parentReminders.map((r, i) => (
                <li key={i} className="rounded-lg bg-amber-50 px-2 py-1">{r.subject}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No pending parent messages.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Instructional resources</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {ctx.lessonPlans.slice(0, 4).map((p) => (
              <li key={p.id} className="text-slate-700">{p.title}</li>
            ))}
            {ctx.knowledgeAssets.slice(0, 3).map((k) => (
              <li key={k.nodeKey} className="text-slate-500">{k.title}</li>
            ))}
            {!ctx.lessonPlans.length && !ctx.knowledgeAssets.length && (
              <li className="text-slate-500">Link lesson plan in workspace form.</li>
            )}
          </ul>
        </section>

        {ctx.learnerProfile.medicalAlerts.length > 0 && (
          <AlertCard
            title="Medical alerts"
            message={ctx.learnerProfile.medicalAlerts.join("; ")}
            severity="high"
          />
        )}

        <Link
          href={`/dashboard/teacher/students/${ctx.student.id}`}
          className="block text-center text-sm font-medium text-brand-600 hover:underline"
        >
          Open full growth plan →
        </Link>
      </aside>
    </div>
  );
}

export function InstructionCloseoutPanel({ summary }: { summary: SessionCloseoutSummary }) {
  return (
    <section aria-label="After instruction" className="space-y-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">After instruction</h2>
        <p className="mt-1 text-sm text-slate-600">Auto-generated from session data, PAJ progress, rules, and evidence.</p>
      </div>

      {summary.evidenceCompleteness.complete ? (
        <SuccessBanner message="Evidence completeness check passed." />
      ) : (
        <WarningBanner message={`Evidence incomplete: ${summary.evidenceCompleteness.missing.join("; ")}`} />
      )}

      <ProgressIndicator value={summary.evidenceCompleteness.score} label="Documentation completeness" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Progress summary</h3>
          <p className="mt-2 text-sm text-slate-600">{summary.progressSummary}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Family communication draft</h3>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-600">{summary.familyCommunicationDraft}</pre>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RecommendationList title="Instructional recommendations" items={summary.instructionalRecommendations} />
        <RecommendationList title="Intervention recommendations" items={summary.interventionRecommendations} />
        <RecommendationList title="Scheduling recommendations" items={summary.schedulingRecommendations} />
      </div>

      {summary.nextCompetencyRecommendation && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          <span className="font-semibold">Next competency: </span>
          {summary.nextCompetencyRecommendation}
        </div>
      )}

      {summary.improvementLoop && (
        <ImprovementLoopSection analysis={summary.improvementLoop} />
      )}
    </section>
  );
}

function ImprovementLoopSection({
  analysis,
}: {
  analysis: NonNullable<SessionCloseoutSummary["improvementLoop"]>;
}) {
  const effectivenessLabel = {
    strong: "Strong",
    moderate: "Moderate",
    needs_improvement: "Needs improvement",
  }[analysis.effectiveness];

  return (
    <div className="space-y-4 rounded-xl border border-violet-300 bg-white p-5">
      <div>
        <h3 className="text-sm font-semibold text-violet-900">The JAG™ Continuous Improvement Loop</h3>
        <p className="mt-1 text-xs text-slate-500">
          Captured, analyzed, and fed back into recommendations, rankings, and scheduling intelligence.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricChip label="Effectiveness" value={effectivenessLabel} />
        <MetricChip label="Confidence" value={`${analysis.confidence}%`} />
        <MetricChip label="Repeatability" value={analysis.repeatability} />
      </div>

      {analysis.explanation && (
        <p className="text-sm text-slate-600">{analysis.explanation}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightList title="What worked" items={analysis.whatWorked} tone="positive" />
        <InsightList title="What did not" items={analysis.whatDidNot} tone="neutral" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RecommendationList title="Future instruction" items={analysis.recommendations.instructional} />
        <RecommendationList title="Intervention ranking" items={analysis.recommendations.interventions} />
        <RecommendationList title="Scheduling intelligence" items={analysis.recommendations.scheduling} />
        <RecommendationList title="Competency sequencing" items={analysis.recommendations.competencySequencing} />
        <RecommendationList title="Family guidance" items={analysis.recommendations.familyGuidance} />
        <RecommendationList title="Executive reporting" items={analysis.recommendations.executiveReporting} />
      </div>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold capitalize text-slate-900">{value}</p>
    </div>
  );
}

function InsightList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "neutral";
}) {
  const border = tone === "positive" ? "border-emerald-200" : "border-amber-200";
  return (
    <div className={`rounded-xl border ${border} p-4`}>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {items.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">None identified.</p>
      )}
    </div>
  );
}

function RecommendationList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {items.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">None generated.</p>
      )}
    </div>
  );
}

export function InstructionSessionHeader({
  ctx,
  breadcrumbs,
  contextNav,
}: {
  ctx: InstructionDeliveryContext;
  breadcrumbs: { label: string; href?: string }[];
  contextNav: { id: string; label: string; href: string; active?: boolean }[];
}) {
  return (
    <div className="space-y-4">
      <Breadcrumbs items={breadcrumbs} />
      <PageHeader
        title={ctx.courseName}
        subtitle={`${ctx.sectionCode} · ${ctx.scheduledLabel} · ${ctx.lessonStatus.replace(/_/g, " ")}`}
        actions={
          ctx.meetLink ? (
            <a
              href={ctx.meetLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Join Meet
            </a>
          ) : undefined
        }
      />
      {contextNav.length > 1 && <ContextNavigation items={contextNav} />}
    </div>
  );
}
