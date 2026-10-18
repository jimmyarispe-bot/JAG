import type { ReactNode } from "react";

import type { LeadContract } from "@/lib/admissions/contract/for-lead";
import type { BlockSignature } from "@/lib/admissions/contract/packet";

/**
 * A CONTRACT ON A PAGE - THE SAME LAYOUT FOR JIMMY'S PREVIEW, THE PARENT
 * SIGNING IT, AND THE PRINTED / PDF COPY.
 *
 * Jimmy, 18 October 2026: "parents and us need to be able to print pdf
 * versions of all of this". Print is the browser's own "Save as PDF": the
 * screen-only controls carry `print:hidden`, and the styles below lay the
 * contract out for paper. One document, so the PDF a parent keeps and the one
 * the school keeps are the same thing.
 *
 * The HTML comes from render.ts, which escapes every value it inserts. The
 * surrounding text is the school's own contract wording from source.
 */

export type { BlockSignature } from "@/lib/admissions/contract/packet";

const CONTRACT_CSS = `
.jag-contract { color: #0f172a; font-size: 14px; line-height: 1.6; }
.jag-contract h2 { font-size: 20px; font-weight: 700; margin: 0 0 12px; }
.jag-contract h3 { font-size: 15px; font-weight: 700; margin: 18px 0 6px; text-transform: none; }
.jag-contract p { margin: 0 0 10px; }
.jag-contract ol, .jag-contract ul { margin: 0 0 10px 22px; }
.jag-contract ol { list-style: decimal; }
.jag-contract ul { list-style: disc; }
.jag-contract li { margin-bottom: 6px; }
.jag-contract table { border-collapse: collapse; width: 100%; margin: 8px 0 14px; font-size: 13px; }
.jag-contract th, .jag-contract td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; vertical-align: top; }
.jag-contract .contract-facts th { width: 40%; background: #f8fafc; font-weight: 600; }
.jag-contract .contract-schedule thead th, .jag-contract .contract-schedule tfoot th { background: #f8fafc; }
.jag-contract .contract-derivation th { background: #f8fafc; }
.jag-contract .contract-initials { font-style: italic; color: #334155; margin-top: 12px; }
.jag-contract .contract-binding { font-weight: 700; margin-top: 12px; }
@media print {
  .jag-contract-block { break-inside: avoid-page; }
  .jag-contract-page { box-shadow: none !important; border: none !important; padding: 0 !important; }
}
`;

function signedLine(sig: BlockSignature): string {
  const when = new Date(sig.signedAt).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${sig.signatureText} — ${sig.signerName}, ${when} ET`;
}

export function ContractDocument({
  contract,
  signatures,
  renderBlockFooter,
  header,
}: {
  contract: LeadContract;
  /** By template key. Shown on the page and on the PDF. */
  signatures?: Readonly<Record<string, BlockSignature>>;
  /** The parent's initials / signature form, below each block. Screen only. */
  renderBlockFooter?: (templateKey: string) => ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="jag-contract-page mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <style>{CONTRACT_CSS}</style>
      {header}
      <div className="jag-contract space-y-8">
        {contract.blocks.map((block, index) => {
          const sig = signatures?.[block.templateKey];
          const isLast = index === contract.blocks.length - 1;
          return (
            <section key={block.templateKey} className="jag-contract-block border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Part {block.sortOrder} of {contract.blocks.length} · {block.title}
              </p>
              <div dangerouslySetInnerHTML={{ __html: block.html }} />
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold">{isLast ? "Signature: " : "Initials: "}</span>
                {sig ? signedLine(sig) : <span className="text-slate-500">not yet signed</span>}
              </div>
              {!sig && renderBlockFooter ? <div className="print:hidden">{renderBlockFooter(block.templateKey)}</div> : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
