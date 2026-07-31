export type EmployeeDto = {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
  schoolId: string | null;
  status: string;
  hireDate: string | null;
};

export type CreateApplicantCommand = {
  displayName: string;
  email: string;
  jobTitle?: string | null;
  schoolId?: string | null;
};

export type HireEmployeeCommand = {
  employeeId: string;
  hireDate?: string;
};
