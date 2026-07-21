import { canInlinePreview, detectPreviewKind } from "@/lib/documents/preview";

interface DocumentPreviewProps {
  title: string;
  mimeType: string | null;
  fileUrl: string | null;
  description?: string;
}

export function DocumentPreview({
  title,
  mimeType,
  fileUrl,
  description,
}: DocumentPreviewProps) {
  const kind = detectPreviewKind(mimeType);

  if (!fileUrl) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <p className="font-medium text-slate-800">No file attached</p>
        {description ? <p className="mt-2 whitespace-pre-wrap">{description}</p> : null}
      </div>
    );
  }

  if (!canInlinePreview(mimeType)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <p className="font-medium text-slate-800">
          {kind === "office"
            ? "Office preview requires a future provider adapter."
            : "Inline preview is not available for this file type."}
        </p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-brand-700 hover:underline"
        >
          Open {title}
        </a>
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        title={`Preview of ${title}`}
        src={fileUrl}
        className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white"
      />
    );
  }

  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fileUrl}
        alt={title}
        className="max-h-[70vh] w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
      />
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Text preview</p>
      <a href={fileUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
        Open text file
      </a>
      {description ? (
        <pre className="mt-4 max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">
          {description}
        </pre>
      ) : null}
    </div>
  );
}
