export type SchoolRecord = {
  id: string;
  displayName: string;
  code: string;
  organizationId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ProgramRecord = {
  id: string;
  displayName: string;
  schoolId?: string | null;
  code?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdministrationRepository = {
  getSchool(id: string): Promise<SchoolRecord | null>;
  saveSchool(record: SchoolRecord): Promise<SchoolRecord>;
  getProgram(id: string): Promise<ProgramRecord | null>;
  saveProgram(record: ProgramRecord): Promise<ProgramRecord>;
  listSchoolsByOrganization(organizationId: string): Promise<SchoolRecord[]>;
};
