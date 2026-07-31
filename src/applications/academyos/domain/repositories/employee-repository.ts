export type EmployeeRecord = {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string | null;
  schoolId?: string | null;
  status: string;
  hireDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeRepository = {
  getById(id: string): Promise<EmployeeRecord | null>;
  listBySchool(schoolId: string): Promise<EmployeeRecord[]>;
  save(record: EmployeeRecord): Promise<EmployeeRecord>;
  archive(id: string): Promise<EmployeeRecord | null>;
};
