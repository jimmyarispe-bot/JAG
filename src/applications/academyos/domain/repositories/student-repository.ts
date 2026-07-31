export type StudentRecord = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  schoolId?: string | null;
  familyId?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentRepository = {
  getById(id: string): Promise<StudentRecord | null>;
  listBySchool(schoolId: string): Promise<StudentRecord[]>;
  save(record: StudentRecord): Promise<StudentRecord>;
  archive(id: string): Promise<StudentRecord | null>;
};
