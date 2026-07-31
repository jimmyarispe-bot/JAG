export type MessageDto = {
  id: string;
  displayName: string;
  body: string | null;
  studentId: string | null;
  familyId: string | null;
  channel: string;
  status: string;
};

export type AnnouncementDto = {
  id: string;
  displayName: string;
  body: string | null;
  schoolId: string | null;
  audience: string;
  status: string;
  publishOn: string | null;
};

export type CreateMessageCommand = {
  displayName: string;
  channel: string;
  body?: string | null;
  studentId?: string | null;
  familyId?: string | null;
};

export type PublishAnnouncementCommand = {
  displayName: string;
  audience: string;
  body?: string | null;
  schoolId?: string | null;
  publishOn?: string | null;
};
