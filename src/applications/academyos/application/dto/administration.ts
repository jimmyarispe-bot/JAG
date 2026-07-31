export type SchoolDto = {
  id: string;
  displayName: string;
  code: string;
  organizationId: string;
  status: string;
};

export type ProgramDto = {
  id: string;
  displayName: string;
  schoolId: string | null;
  code: string | null;
  status: string;
};

export type CreateSchoolCommand = {
  displayName: string;
  code: string;
  organizationId: string;
};

export type CreateProgramCommand = {
  displayName: string;
  schoolId?: string | null;
  code?: string | null;
};
