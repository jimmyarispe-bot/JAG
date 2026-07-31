export type EnrollmentRecord = {
  id: string;
  studentId: string;
  sectionId?: string | null;
  classId?: string | null;
  programId?: string | null;
  startDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type EnrollmentRepository = {
  getById(id: string): Promise<EnrollmentRecord | null>;
  listByStudent(studentId: string): Promise<EnrollmentRecord[]>;
  save(record: EnrollmentRecord): Promise<EnrollmentRecord>;
};
