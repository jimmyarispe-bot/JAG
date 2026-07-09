import type { JagProfile } from "@/lib/platform/jag-profile";
import { AiRecommendationCard, CompetencyCard, ProgressIndicator } from "@/components/experience-system";

export function JagProfileOverviewPanel({ profile }: { profile: JagProfile }) {
  const { identity, learning, readiness, ai } = profile;
  const riskTone =
    readiness.riskIndicators.level === "high"
      ? "text-rose-700 bg-rose-50 border-rose-200"
      : readiness.riskIndicators.level === "medium"
        ? "text-amber-800 bg-amber-50 border-amber-200"
        : "text-emerald-800 bg-emerald-50 border-emerald-200";

  const masteryLevel = learning.activeCompetencyProgress?.mastery_level ?? 0;
  const masteryProgress = Math.min(100, masteryLevel * 25);

  return (
    <section aria-label="JAG Profile" className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">The JAG Profile™</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">{identity.displayName}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {identity.demographics.gradeLevel ?? "Grade N/A"} · {identity.enrollment.program ?? "Program N/A"} ·{" "}
          {identity.campuses.campusName ?? identity.campuses.schoolName ?? "Campus N/A"}
        </p>
        {identity.family.familyName && (
          <p className="mt-1 text-sm text-slate-500">Family: {identity.family.familyName}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Graduation readiness" value={`${readiness.graduationReadiness.score}%`} />
        <MetricTile label="Transition readiness" value={`${readiness.transitionReadiness.score}%`} />
        <MetricTile label="Attendance (recent)" value={`${readiness.attendanceSummary.ratePercent}%`} />
        <div className={`rounded-xl border px-4 py-3 ${riskTone}`}>
          <p className="text-xs font-medium uppercase opacity-80">Risk</p>
          <p className="mt-0.5 text-lg font-semibold capitalize">{readiness.riskIndicators.level}</p>
        </div>
      </div>

      {learning.activeCompetency && (
        <CompetencyCard
          title={learning.activeCompetency.title}
          domain={learning.activeCompetency.learningDomainKey}
          progress={masteryProgress}
          masteryLevel={masteryLevel >= 4 ? "mastered" : masteryLevel >= 3 ? "proficient" : masteryLevel >= 2 ? "developing" : "emerging"}
          description={
            learning.prerequisiteStatus.ok
              ? "Prerequisite chain satisfied"
              : `Prerequisites pending: ${learning.prerequisiteStatus.missing.join(", ")}`
          }
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Learning summary</h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>{learning.masterySummary.proficientCount} proficient competencies</li>
            <li>{learning.masterySummary.inProgressCount} in progress</li>
            <li>
              {profile.evidence.artifacts.length} artifacts · {profile.evidence.assessments.length} assessments
            </li>
            <li>{profile.instruction.lessonHistory.length} recent sessions on record</li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Executive summary</h3>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-600">
            {readiness.executiveSummaries.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <ProgressIndicator value={ai.confidence} label="AI recommendation confidence" />

      {ai.recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">AI recommendations</h3>
          {ai.recommendations.slice(0, 4).map((rec, i) => (
            <AiRecommendationCard
              key={i}
              recommendation={{
                id: `jag-${i}`,
                title: rec.title,
                rationale: rec.rationale,
                priority: rec.priority ?? "medium",
                confidence: rec.confidence,
              }}
            />
          ))}
        </div>
      )}

      {ai.explanations.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 text-sm text-violet-900">
          <p className="font-medium">Explainability</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 opacity-90">
            {ai.explanations.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
