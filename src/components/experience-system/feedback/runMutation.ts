/** Normalize server-action results that return `{ error?: string }` into thrown errors for useActionFeedback. */
export function assertActionResult(result: unknown): void {
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    typeof (result as { error?: unknown }).error === "string" &&
    (result as { error: string }).error
  ) {
    throw new Error((result as { error: string }).error);
  }
}
