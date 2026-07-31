export type InquiryDto = {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  schoolId: string | null;
  source: string | null;
  status: string;
};

export type ApplicationDto = {
  id: string;
  displayName: string;
  inquiryId: string | null;
  studentId: string | null;
  schoolId: string;
  submittedOn: string | null;
  status: string;
};

export type CreateInquiryCommand = {
  displayName: string;
  email: string;
  phone?: string | null;
  schoolId?: string | null;
  source?: string | null;
};

export type CreateApplicationCommand = {
  displayName: string;
  schoolId: string;
  inquiryId?: string | null;
  studentId?: string | null;
};

export type DecideApplicationCommand = {
  applicationId: string;
  decision: "accept" | "decline";
};
