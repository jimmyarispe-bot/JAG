/**
 * Maps createStudent server results to client UI state.
 * A created student id always wins over any error string so the UI never
 * shows a failure banner after a successful commit.
 */
export type StudentCreateActionResult =
  | { id: string; error?: undefined }
  | { error: string; id?: undefined };

export type StudentCreateUiState =
  | { status: "success"; studentId: string; errorMessage: null }
  | { status: "error"; studentId: null; errorMessage: string };

export function resolveStudentCreateUiState(
  result: { id?: string | null; error?: string | null } | null | undefined
): StudentCreateUiState {
  const studentId = typeof result?.id === "string" && result.id.length > 0 ? result.id : null;
  if (studentId) {
    return { status: "success", studentId, errorMessage: null };
  }

  const errorMessage =
    typeof result?.error === "string" && result.error.trim()
      ? result.error.trim()
      : "Unable to create student.";

  return { status: "error", studentId: null, errorMessage };
}
