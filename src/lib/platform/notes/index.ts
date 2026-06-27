export { createNote, deleteNote, pinNote, updateNote } from "@/lib/platform/notes/actions";
export { getEntityNotes, getPinnedNotes, getStudentNotes, searchNotes } from "@/lib/platform/notes/query";
export type {
  CreateNoteInput,
  NoteAttachment,
  NoteCategory,
  NoteSource,
  NoteVisibility,
  PlatformNote,
  UpdateNoteInput,
} from "@/lib/platform/notes/types";
