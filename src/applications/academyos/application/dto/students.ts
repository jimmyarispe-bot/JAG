export type StudentDto = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  schoolId: string | null;
  familyId: string | null;
  status: string;
};

export type EnrollmentDto = {
  id: string;
  studentId: string;
  sectionId: string | null;
  classId: string | null;
  programId: string | null;
  startDate: string;
  status: string;
};

export type CreateStudentCommand = {
  displayName?: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  schoolId?: string | null;
  familyId?: string | null;
};

export type EnrollStudentCommand = {
  studentId: string;
  startDate: string;
  sectionId?: string | null;
  classId?: string | null;
  programId?: string | null;
};
