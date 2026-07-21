import Link from "next/link";
import type { TimelineCommunicationItem } from "@/lib/communications/timeline";

interface CommunicationTimelineProps {
  items: TimelineCommunicationItem[];
  title?: string;
  emptyMessage?: string;
  composeHref?: string;
}

export function CommunicationTimeline({
  items,
  title = "Communications",
  emptyMessage = "No communications recorded",
  composeHref,
}: CommunicationTimelineProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {composeHref && (
          <Link href={composeHref} className="text-xs font-medium text-brand-600 hover:underline">
            Compose
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-900">
                  {item.subject || "(no subject)"}
                </span>
                <span className="text-xs capitalize text-slate-400">
                  {item.type} · {item.status}
                </span>
              </div>
              {item.bodyPreview && (
                <p className="mt-1 line-clamp-2 text-slate-600">{item.bodyPreview}</p>
              )}
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                <span>{new Date(item.createdAt).toLocaleString()}</span>
                {item.senderDisplayName && <span>From {item.senderDisplayName}</span>}
                <Link
                  href={`/dashboard/communications/${item.id}`}
                  className="text-brand-600 hover:underline"
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
