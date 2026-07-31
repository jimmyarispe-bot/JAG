export type AttendanceRecordRow = {
  id: string;
  studentId: string;
  sectionId?: string | null;
  classId?: string | null;
  attendanceDate: string;
  attendanceCodeId?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceRepository = {
  getById(id: string): Promise<AttendanceRecordRow | null>;
  listByStudent(studentId: string): Promise<AttendanceRecordRow[]>;
  listByDate(attendanceDate: string): Promise<AttendanceRecordRow[]>;
  save(record: AttendanceRecordRow): Promise<AttendanceRecordRow>;
};
