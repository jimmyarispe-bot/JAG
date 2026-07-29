import { getStudentExperienceHome } from "@/lib/portal/student-experience/home";
import { getStudentExperience } from "@/lib/portal/student-experience/orchestrator";
import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { StudentHomeDashboard } from "@/components/portal/student-experience/StudentHomeDashboard";

export default async function StudentPortalHomePage() {
  const ctx = await requireStudentExperienceContext("/portal/student");
  const home = await getStudentExperienceHome(
    ctx.supabase,
    ctx.sessionUser.id,
    ctx.studentId
  );

  getStudentExperience().publishDashboardViewed({
    organizationId: ctx.organizationId,
    actorUserId: ctx.sessionUser.id,
    studentId: ctx.studentId,
  });

  return (
    <StudentHomeDashboard
      firstName={home.dashboard.student?.first_name ?? ctx.student.first_name}
      score={home.dashboard.score?.overallScore}
      attendanceRate={home.dashboard.attendanceRate}
      goalCount={home.dashboard.goals.length}
      upcomingSessions={home.upcomingSessions}
      announcements={home.announcements}
      notifications={home.notifications}
      tasks={home.tasks}
      deadlines={home.deadlines}
      quickActions={home.quickActions}
    />
  );
}
