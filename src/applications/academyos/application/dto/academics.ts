export type CourseDto = {
  id: string;
  displayName: string;
  code: string;
  programId: string | null;
  status: string;
};

export type SectionDto = {
  id: string;
  displayName: string;
  courseId: string;
  termId: string | null;
  teacherId: string | null;
  classroomId: string | null;
  status: string;
};

export type AssessmentDto = {
  id: string;
  displayName: string;
  studentId: string | null;
  sectionId: string | null;
  administeredOn: string | null;
  score: number | null;
  masteryBand: "below" | "approaching" | "mastery" | "unknown";
  status: string;
};

export type CreateCourseCommand = {
  displayName: string;
  code: string;
  programId?: string | null;
};

export type CreateSectionCommand = {
  displayName: string;
  courseId: string;
  termId?: string | null;
  teacherId?: string | null;
  classroomId?: string | null;
};

export type RecordAssessmentCommand = {
  displayName: string;
  studentId?: string | null;
  sectionId?: string | null;
  administeredOn?: string | null;
  score?: number | null;
};
