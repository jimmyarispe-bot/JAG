/**
 * SIS parent portal — operational student data (token-scoped).
 */

import { createSisAttendanceService } from "./attendance";
import { createClassEnrollmentService } from "./classes";
import { createFamiliesService } from "./families";
import {
  findStudentByParentToken,
  listStudentTimeline,
  listSupportPlans,
} from "./store";
import { createSisStudentsService } from "./students";

export function createSisParentPortalService() {
  const attendance = createSisAttendanceService();
  const classes = createClassEnrollmentService();
  const families = createFamiliesService();
  const students = createSisStudentsService();

  return {
    resolve(token: string) {
      const student = findStudentByParentToken(token);
      if (!student) return { error: "Invalid parent access token." as const };

      const supportPlans = listSupportPlans(
        student.organizationId,
        student.id
      ).filter((p) => p.status === "Active" || p.status === "Review Due");

      return {
        student,
        attendance: attendance.list(student.organizationId, student.id),
        schedule: classes.list(student.organizationId, student.id),
        supportPlans,
        family: families.list(student.organizationId, student.id),
        medical: student.medical,
        timeline: listStudentTimeline(student.organizationId, student.id),
        announcements: Object.freeze([
          {
            id: "re-enrollment",
            title: "Re-enrollment",
            body: "Contact the school office to begin re-enrollment when available.",
          },
        ]),
      };
    },

    updateEmergencyContacts(input: {
      token: string;
      memberId: string;
      phone?: string | null;
      email?: string | null;
    }) {
      const student = findStudentByParentToken(input.token);
      if (!student) return { error: "Invalid parent access token." };
      return families.patch({
        organizationId: student.organizationId,
        memberId: input.memberId,
        actor: `parent:${input.token.slice(0, 8)}`,
        phone: input.phone,
        email: input.email,
      });
    },

    requestReenrollment(input: { token: string }) {
      const student = findStudentByParentToken(input.token);
      if (!student) return { error: "Invalid parent access token." };
      return students.patch({
        organizationId: student.organizationId,
        studentId: student.id,
        actor: `parent:${input.token.slice(0, 8)}`,
        // marker via graduationTarget note field reuse avoided — timeline only
      });
    },
  };
}
