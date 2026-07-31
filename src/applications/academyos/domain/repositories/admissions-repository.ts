export type InquiryRecord = {
  id: string;
  displayName: string;
  email: string;
  phone?: string | null;
  schoolId?: string | null;
  source?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationRecord = {
  id: string;
  displayName: string;
  inquiryId?: string | null;
  studentId?: string | null;
  schoolId: string;
  submittedOn?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdmissionsRepository = {
  getInquiry(id: string): Promise<InquiryRecord | null>;
  saveInquiry(record: InquiryRecord): Promise<InquiryRecord>;
  getApplication(id: string): Promise<ApplicationRecord | null>;
  saveApplication(record: ApplicationRecord): Promise<ApplicationRecord>;
  listApplicationsBySchool(schoolId: string): Promise<ApplicationRecord[]>;
};
