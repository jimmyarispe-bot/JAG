"use client";

import {
  AiInsightCard,
  AiConfidenceChart,
  AtomicSkillCard,
  CompetencyCard,
  CompetencyCompletionChart,
  CompetencyTable,
  EvidenceCard,
  EvidenceQualityChart,
  EvidenceTable,
  EvidenceTimeline,
  ExecutionPipeline,
  ExecutionPipelineCard,
  FilterPanel,
  GlobalShell,
  InterventionCard,
  JourneyTimeline,
  MasteryProgressChart,
  MetricCard,
  ProgressTimeline,
  QuickActionsPanel,
  RecommendationCard,
  ShellNavigation,
  StudentCard,
  StudentTable,
  WorkspaceLayout,
} from "../index";

const sampleWorkspaces = [
  { id: "teacher", label: "Teacher Workspace", href: "/dashboard/teacher", description: "Daily instructional hub", active: true },
  { id: "students", label: "Student Success", href: "/dashboard/students", description: "Unified student profiles" },
  { id: "executive", label: "Executive Home", href: "/dashboard", description: "Organization overview" },
];

const sampleNav = [
  { id: "my-day", label: "My Day", href: "#", active: true },
  { id: "progress", label: "Progress", href: "#" },
  { id: "interventions", label: "Interventions", href: "#", badge: 3 },
];

export function DesignSystemShowcase() {
  return (
    <GlobalShell
      title="Workspace Design System"
      subtitle="The JAG OS reusable component library"
      workspaces={sampleWorkspaces}
      navItems={sampleNav}
      fullName="Demo User"
      roleLabel="Instructional Staff"
      notifications={[
        { id: "1", title: "Session reminder", body: "Reading block starts in 15 minutes.", createdAt: new Date().toISOString() },
      ]}
    >
      <WorkspaceLayout
        leftNavTitle="Views"
        leftNav={<ShellNavigation items={sampleNav} variant="pills" ariaLabel="Demo views" />}
        insightPanel={
          <div className="space-y-4">
            <AiInsightCard
              title="Phonological awareness gap"
              insight="3 students show declining segmenting scores. Consider a targeted warm-up before today's literacy block."
              confidence={78}
              source="Progress analytics"
            />
            <RecommendationCard
              title="Schedule progress probe"
              rationale="Weekly structured literacy probes are due for 2 roster students."
              priority="high"
              actionLabel="Open roster"
              actionHref="#"
            />
            <QuickActionsPanel
              actions={[
                { id: "1", label: "Log session notes", variant: "primary" },
                { id: "2", label: "Record evidence", variant: "secondary" },
              ]}
            />
          </div>
        }
        main={
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Metrics</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Today's sessions" value="4" description="Scheduled for today" accent="brand" icon={<span className="text-lg font-bold">T</span>} />
                <MetricCard title="Weekly hours" value="18h" description="12 sessions" accent="sky" icon={<span className="text-lg font-bold">H</span>} />
                <MetricCard title="Compliance" value="2" description="Needs attention" accent="amber" icon={<span className="text-lg font-bold">C</span>} />
                <MetricCard title="Alerts" value="1" description="Mission Control" accent="rose" icon={<span className="text-lg font-bold">!</span>} />
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Cards</h2>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <StudentCard id="1" name="Ava Martinez" subtitle="Grade 3 · Reading" masteryLevel="developing" riskLevel="low" href="#" />
                <CompetencyCard title="Phonemic awareness" domain="Structured Literacy" progress={72} masteryLevel="proficient" />
                <AtomicSkillCard name="Segmenting phonemes" competency="Phonological awareness" masteryLevel="developing" evidenceCount={5} lastAssessed="Jun 20" />
                <EvidenceCard title="Oral reading sample" artifactType="observation" createdAt="2026-06-25" qualityScore={85} />
                <InterventionCard type="Small-group decoding" goal="Increase CVC fluency to 40 WPM" status="active" reviewDate="Jul 1" />
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Charts</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <MasteryProgressChart points={[{ label: "W1", value: 2 }, { label: "W2", value: 3 }, { label: "W3", value: 3 }, { label: "W4", value: 4 }]} />
                <EvidenceQualityChart points={[{ label: "Obs", value: 82 }, { label: "Work", value: 74 }, { label: "Assess", value: 91 }]} />
                <CompetencyCompletionChart value={68} />
                <AiConfidenceChart points={[{ label: "Risk", value: 72 }, { label: "Rec", value: 85 }, { label: "Gap", value: 78 }]} />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <ProgressTimeline
                entries={[
                  { id: "1", title: "Level 3 achieved", subtitle: "Structured Literacy", timestamp: "2026-06-20", status: "complete" },
                  { id: "2", title: "Current focus: blending", timestamp: "2026-06-25", status: "current" },
                ]}
              />
              <EvidenceTimeline
                entries={[
                  { id: "1", title: "Running record", timestamp: "2026-06-24", status: "complete" },
                  { id: "2", title: "Writing sample", timestamp: "2026-06-26", status: "complete" },
                ]}
              />
              <JourneyTimeline
                entries={[
                  { id: "1", title: "Journey started", timestamp: "2026-01-15", status: "complete" },
                  { id: "2", title: "PAJ milestone", timestamp: "2026-06-01", status: "current" },
                ]}
              />
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Execution Pipeline</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <ExecutionPipelineCard
                  subtitle="Vertical — current step: Collect Evidence"
                  currentStepId="collect-evidence"
                />
                <ExecutionPipelineCard
                  subtitle="Horizontal compact — current step: Evaluate Rules"
                  currentStepId="evaluate-rules"
                  orientation="horizontal"
                  compact
                  title=""
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-4">
              <FilterPanel
                title="Filter students"
                options={[
                  { id: "all", label: "All students", count: 12 },
                  { id: "at-risk", label: "At risk", count: 2 },
                  { id: "mastery", label: "Near mastery", count: 4 },
                ]}
                activeId="all"
              />
              <div className="lg:col-span-3 space-y-4">
                <StudentTable
                  rows={[
                    { id: "1", name: "Ava Martinez", grade: "3", lastSession: "Jun 27" },
                    { id: "2", name: "Noah Chen", grade: "2", lastSession: "Jun 26" },
                  ]}
                />
                <CompetencyTable
                  rows={[
                    { id: "1", competency: "Phonemic awareness", domain: "Literacy", progress: 72 },
                    { id: "2", competency: "Number sense", domain: "Math", progress: 58 },
                  ]}
                />
                <EvidenceTable
                  rows={[
                    { id: "1", title: "Oral reading", type: "observation", date: "Jun 25" },
                    { id: "2", title: "Fluency probe", type: "assessment", date: "Jun 24" },
                  ]}
                />
              </div>
            </section>
          </div>
        }
      />
    </GlobalShell>
  );
}
