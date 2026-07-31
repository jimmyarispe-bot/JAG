export type CourseRecord = {
  id: string;
  displayName: string;
  code: string;
  programId?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SectionRecord = {
  id: string;
  displayName: string;
  courseId: string;
  termId?: string | null;
  teacherId?: string | null;
  classroomId?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AssessmentRecord = {
  id: string;
  displayName: string;
  studentId?: string | null;
  sectionId?: string | null;
  administeredOn?: string | null;
  score?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AcademicRepository = {
  getCourse(id: string): Promise<CourseRecord | null>;
  saveCourse(record: CourseRecord): Promise<CourseRecord>;
  getSection(id: string): Promise<SectionRecord | null>;
  saveSection(record: SectionRecord): Promise<SectionRecord>;
  getAssessment(id: string): Promise<AssessmentRecord | null>;
  saveAssessment(record: AssessmentRecord): Promise<AssessmentRecord>;
};
