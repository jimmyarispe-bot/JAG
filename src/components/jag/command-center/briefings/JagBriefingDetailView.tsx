import Link from "next/link";
import type {
  JagBriefingRecommendation,
  JagBriefingSection,
  JagExecutiveBriefing,
} from "@/lib/jag-command-center/briefing-engine/types";
import { brandPdfForOrganization } from "@/lib/jag-command-center/branding";
import { explainBriefingSectionForDetail } from "@/lib/jag-command-center/explain";
import { JagExplainPanel } from "../explain";
import { JagSection } from "../JagSection";
import {
  JagBriefingToolbar,
  type BriefingViewMode,
} from "./JagBriefingToolbar";
import { JagBriefingSectionActions } from "./JagBriefingSectionActions";

export function JagBriefingDetailView({
  briefing,
  mode = "standard",
  readOnly = false,
}: {
  readonly briefing: JagExecutiveBriefing;
  readonly mode?: BriefingViewMode;
  readonly readOnly?: boolean;
}) {
  const board = mode === "board";
  const print = mode === "print" || mode === "board";
  const pdfBrand = brandPdfForOrganization(
    briefing.organizationId ?? briefing.organizationIds[0]
  );

  return (
    <div
      className={`space-y-6 ${print ? "jag-briefing-print" : ""} ${
        board ? "jag-briefing-board" : ""
      }`}
    >
      <JagSection
        title={briefing.title}
        description={`${briefing.kindLabel} · ${briefing.scope} · Generated ${briefing.generatedAt} by ${briefing.generatedBy}`}
        actions={
          readOnly ? null : (
            <Link
              href="/jag/briefings"
              className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)] print:hidden"
            >
              All briefings
            </Link>
          )
        }
      >
        <div className="print:hidden">
          <JagBriefingToolbar
            briefingId={briefing.id}
            shareToken={briefing.shareToken}
            mode={mode}
            readOnly={readOnly}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4 text-xs text-[var(--jag-muted)]">
          <Meta
            label="Organizations"
            value={briefing.organizationNames.join(", ")}
          />
          <Meta
            label="Confidence"
            value={
              briefing.overallConfidence === null
                ? "—"
                : briefing.overallConfidence.toFixed(2)
            }
            mono
          />
          <Meta label="Sources" value={String(briefing.sourceCount)} mono />
          <Meta
            label="Window"
            value={`${briefing.window.start.slice(0, 10)} → ${briefing.window.end.slice(0, 10)}`}
            mono
          />
        </div>

        {briefing.insights.length > 0 ? (
          <div
            className={`mt-4 grid gap-2 ${
              board ? "md:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {briefing.insights.map((insight) => (
              <div
                key={insight.kind}
                className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3"
              >
                <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
                  {insight.label}
                </p>
                <p className="mt-1 text-sm text-[var(--jag-text)]">
                  {insight.value}
                </p>
                <p className="mt-1 text-[11px] text-[var(--jag-muted)]">
                  {insight.detail}
                </p>
                {insight.decisionHref ? (
                  <Link
                    href={insight.decisionHref}
                    className="mt-2 inline-block text-[11px] text-[var(--jag-muted)] hover:text-[var(--jag-text)] print:hidden"
                  >
                    Open decision
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {briefing.scheduledReview ? (
          <p className="mt-3 text-xs text-[var(--jag-muted)]">
            Review scheduled {briefing.scheduledReview.at.slice(0, 10)} by{" "}
            {briefing.scheduledReview.scheduledBy}
            {briefing.scheduledReview.note
              ? ` — ${briefing.scheduledReview.note}`
              : ""}
          </p>
        ) : null}

        {briefing.notes.length > 0 ? (
          <div className="mt-3 space-y-1 text-xs text-[var(--jag-muted)]">
            <p className="text-[10px] uppercase tracking-[0.08em]">
              Executive notes
            </p>
            {briefing.notes.map((n) => (
              <p key={n.id}>
                {n.at.slice(0, 16)} · {n.actor}: {n.text}
              </p>
            ))}
          </div>
        ) : null}
      </JagSection>

      {briefing.sections.map((section) => (
        <BriefingSectionBlock
          key={section.id}
          briefingId={briefing.id}
          organizationId={briefing.organizationId}
          section={section}
          board={board}
          readOnly={readOnly}
        />
      ))}

      <footer className="border-t border-[var(--jag-border)] pt-4 text-xs text-[var(--jag-muted)]">
        {pdfBrand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- tenant CDN / data URLs
          <img
            src={pdfBrand.logoUrl}
            alt=""
            className="mb-2 h-6 max-w-[8rem] object-contain"
          />
        ) : null}
        <p style={{ color: pdfBrand.primaryColor }}>{pdfBrand.title}</p>
        <p className="mt-1">{pdfBrand.footerText}</p>
        {pdfBrand.poweredBy && !pdfBrand.footerText.includes(pdfBrand.poweredBy) ? (
          <p className="mt-0.5">{pdfBrand.poweredBy}</p>
        ) : null}
      </footer>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .jag-briefing-print section {
            break-inside: avoid;
            border-color: #ccc !important;
            background: #fff !important;
            color: #111 !important;
          }
        }
        .jag-briefing-board h2 {
          font-size: 1.25rem;
        }
        .jag-briefing-board .board-narrative {
          font-size: 1.05rem;
          line-height: 1.55;
        }
      `}</style>
    </div>
  );
}

function BriefingSectionBlock({
  briefingId,
  organizationId,
  section,
  board,
  readOnly,
}: {
  readonly briefingId: string;
  readonly organizationId: string;
  readonly section: JagBriefingSection;
  readonly board: boolean;
  readonly readOnly?: boolean;
}) {
  const sectionExplanation = explainBriefingSectionForDetail({
    organizationId,
    briefingId,
    sectionId: section.id,
    title: section.title,
    narrative: section.narrative,
    confidence: section.confidence ?? 0.5,
    evidence: section.evidenceReferences.map((e) => ({
      id: e.id,
      source: e.source,
      summary: e.summary || e.code || e.id,
    })),
    contributors: section.contributorSources,
    policies: section.policyReferences,
  });

  return (
    <section className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-[var(--jag-text)]">
          {section.title}
        </h2>
        <span className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted)]">
          {section.confidence === null
            ? "conf —"
            : `conf ${section.confidence.toFixed(2)}`}
        </span>
      </div>

      <p
        className={`leading-relaxed text-[var(--jag-muted)] ${
          board ? "board-narrative text-base" : "text-sm"
        }`}
      >
        {section.narrative}
      </p>

      {section.bullets.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--jag-text)]">
          {section.bullets.map((b) => (
            <li key={b}>– {b}</li>
          ))}
        </ul>
      ) : null}

      {section.recommendations.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Recommendations
          </p>
          {section.recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 border-t border-[var(--jag-border)] pt-3 text-[11px] text-[var(--jag-muted)] sm:grid-cols-2 lg:grid-cols-4">
        <RefList
          label="Evidence references"
          items={section.evidenceReferences.map(
            (e) =>
              `${e.source}${e.code ? ` · ${e.code}` : ""}${
                e.summary ? ` — ${e.summary}` : ""
              }`
          )}
          empty="None attached"
        />
        <RefList
          label="Contributor sources"
          items={section.contributorSources}
          empty="None"
          mono
        />
        <RefList
          label="Policy references"
          items={section.policyReferences}
          empty="None applicable"
          mono
        />
        <div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
            Confidence
          </p>
          <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
            {section.confidence === null
              ? "Unavailable"
              : section.confidence.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-3 print:hidden">
        <JagExplainPanel
          explanation={sectionExplanation}
          graphHref={`/jag/graph?org=${encodeURIComponent(organizationId)}&focus=${encodeURIComponent(`briefing:${briefingId}:${section.id}`)}`}
        />
      </div>

      <div className="print:hidden">
        <JagBriefingSectionActions
          briefingId={briefingId}
          section={section}
          readOnly={readOnly}
        />
      </div>
    </section>
  );
}

function RecommendationCard({
  recommendation,
}: {
  readonly recommendation: JagBriefingRecommendation;
}) {
  const ex = recommendation.explainability;
  return (
    <div className="rounded border border-[var(--jag-border)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-[var(--jag-text)]">{recommendation.title}</p>
          <p className="mt-0.5 text-xs text-[var(--jag-muted)]">
            {recommendation.rationale}
          </p>
        </div>
        {recommendation.decisionHref ? (
          <Link
            href={recommendation.decisionHref}
            className="shrink-0 text-[11px] text-[var(--jag-muted)] hover:text-[var(--jag-text)] print:hidden"
          >
            Open in Decision Center
          </Link>
        ) : (
          <span className="text-[11px] text-[var(--jag-muted-2)]">
            No decision link
          </span>
        )}
      </div>

      <details className="mt-2 text-[11px] text-[var(--jag-muted)]">
        <summary className="cursor-pointer text-[var(--jag-text)]">
          Show Evidence · Contributors · Policies · Confidence · Dependencies ·
          Timeline
        </summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <RefList
            label="Show Evidence"
            items={ex.evidence.map(
              (e) => e.summary || e.code || e.id
            )}
            empty="None"
          />
          <RefList
            label="Show Contributors"
            items={ex.contributors}
            empty="None"
            mono
          />
          <RefList
            label="Show Policies"
            items={ex.policies}
            empty="None"
            mono
          />
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
              Show Confidence
            </p>
            <p className="mt-1 font-[family-name:var(--font-jag-mono)]">
              {ex.confidence === null ? "—" : ex.confidence.toFixed(2)}
            </p>
          </div>
          <RefList
            label="Show Dependencies"
            items={ex.dependencies}
            empty="None"
            mono
          />
          <RefList
            label="Show Timeline"
            items={ex.timeline.map((t) => `${t.at.slice(0, 16)} · ${t.message}`)}
            empty="None"
          />
        </div>
      </details>
    </div>
  );
}

function RefList({
  label,
  items,
  empty,
  mono,
}: {
  label: string;
  items: readonly string[];
  empty: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
        {label}
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-[var(--jag-muted)]">{empty}</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.slice(0, 6).map((item) => (
            <li
              key={item}
              className={`truncate ${
                mono ? "font-[family-name:var(--font-jag-mono)]" : ""
              }`}
              title={item}
            >
              {item}
            </li>
          ))}
          {items.length > 6 ? (
            <li className="text-[var(--jag-muted-2)]">+{items.length - 6} more</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[var(--jag-text)] ${
          mono ? "font-[family-name:var(--font-jag-mono)]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
