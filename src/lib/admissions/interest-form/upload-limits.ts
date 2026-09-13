/**
 * What the upload route will actually accept, in one place.
 *
 * WHY THIS FILE EXISTS. The route enforced 10MB, the caption promised 10MB, and
 * the platform in front of both refused the request long before either got a
 * say. A family attaching proof of income — the document GA GOAL requires — saw:
 *
 *     Unexpected token 'R', "Request En"... is not valid JSON
 *
 * That is a 413 body, "Request Entity Too Large", arriving as plain text at a
 * client that called .json() on it without looking. Three components each held
 * their own opinion about the limit and none of them was the one that mattered.
 *
 * VERCEL'S BODY LIMIT. A serverless function request body is capped at 4.5MB,
 * and the cap is applied by the platform, not the handler — the route never
 * runs, so its own polite JSON rejection never happens. Anything the form
 * promises above that ceiling is a promise it cannot keep.
 *
 * WHY THE NUMBER BELOW IS NOT 4.5. Multipart encoding adds a boundary, headers
 * and base64-ish overhead on top of the file's own bytes, so a file measured at
 * exactly 4.5MB does not arrive as 4.5MB. Four leaves room and is still a
 * comfortable phone photograph.
 *
 * WHAT THIS COSTS, STATED PLAINLY. The route's own comment notes a phone
 * photograph of an award letter is routinely three to five megabytes, so this
 * limit will turn some real documents away — with a clear message, at the moment
 * of choosing, rather than a parser error after a wasted upload. Restoring the
 * larger limit means uploading straight to storage through a short-lived signed
 * URL for one server-chosen path, which bypasses the platform body cap
 * altogether. That is the right fix and it is not a one-line change.
 */

/** The real ceiling, below Vercel's 4.5MB platform cap with room for overhead. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** For captions and error messages, so the number is never typed twice. */
export const MAX_UPLOAD_LABEL = "4MB";

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heif",
};

/**
 * What to tell a family when the upload failed and the body was not JSON.
 *
 * The status is the only thing we can trust in that situation, so it decides the
 * wording — and it is included verbatim at the end, because "we could not save
 * that file" with no number behind it is what makes a support conversation take
 * three emails.
 */
export function describeUploadFailure(status: number): string {
  if (status === 413) {
    return `That file is too large to upload. Please attach one under ${MAX_UPLOAD_LABEL}.`;
  }
  if (status === 429) {
    return "Too many uploads in a short time. Please wait a moment and try again.";
  }
  if (status === 408 || status === 504) {
    return "That upload timed out. Please check your connection and try again.";
  }
  if (status >= 500) {
    return `We could not save that file just now. Please try again in a moment. (Error ${status})`;
  }
  return `We could not save that file. (Error ${status})`;
}

/** Refuse before the round trip, so the family learns immediately. */
export function checkFileBeforeUpload(file: {
  size: number;
  type: string;
}): string | null {
  if (file.size === 0) {
    return "That file is empty. Please choose another.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `That file is ${mb}MB, which is over the ${MAX_UPLOAD_LABEL} limit. Please attach a smaller one — a PDF, or a photo taken at a lower resolution.`;
  }
  if (!ALLOWED_UPLOAD_TYPES[file.type]) {
    return "Please attach a PDF, JPG or PNG.";
  }
  return null;
}
