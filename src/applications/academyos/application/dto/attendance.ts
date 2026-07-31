export type AttendanceDto = {
  id: string;
  studentId: string;
  sectionId: string | null;
  classId: string | null;
  attendanceDate: string;
  attendanceCodeId: string | null;
  status: string;
  notes: string | null;
};

export type RecordAttendanceCommand = {
  studentId: string;
  attendanceDate: string;
  status: string;
  sectionId?: string | null;
  classId?: string | null;
  attendanceCodeId?: string | null;
  notes?: string | null;
};

export type AttendanceSummaryDto = {
  studentId: string;
  rate: number;
  chronicallyAbsent: boolean;
  recordCount: number;
};
