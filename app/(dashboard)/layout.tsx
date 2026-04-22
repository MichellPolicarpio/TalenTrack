import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { auth } from "@/lib/auth";
import { getEmployeeByEntraId } from "@/lib/repositories/employee.repository";
import {
  getUnreadNotificationCount,
  listNotificationsForEmployee,
} from "@/lib/repositories/notifications.repository";
import type { NotificationsSnapshotDTO } from "@/lib/actions/notifications.actions";
import { DashboardProvider } from "@/lib/context/dashboard-context";
import { getResumeByEmployeeId } from "@/lib/repositories/resume.repository";
import { type ResumeStatus, RESUME_STATUS } from "@/lib/db/types";

export default async function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const userName = session.user.name ?? "";
  const userEmail = session.user.email ?? "";
  const role = session.user.role;

  let notificationsInitial: NotificationsSnapshotDTO | null = null;
  let resumeStatus: ResumeStatus = RESUME_STATUS.DRAFT;
  const entraId = session.user.entraObjectId;
  if (entraId) {
    const employee = await getEmployeeByEntraId(entraId);
    if (employee) {
      try {
        const [unreadCount, items, resumeWithProfile] = await Promise.all([
          getUnreadNotificationCount(employee.id),
          listNotificationsForEmployee(employee.id, 12),
          getResumeByEmployeeId(employee.id),
        ]);
        
        if (resumeWithProfile) {
          resumeStatus = resumeWithProfile.resume.status;
        }

        notificationsInitial = {
          unreadCount,
          items: items.map((n) => ({
            id: n.id,
            type: n.type,
            message: n.message,
            resumeId: n.resumeId,
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString(),
          })),
        };
      } catch {
        notificationsInitial = { unreadCount: 0, items: [] };
      }
    }
  }

  return (
    <DashboardProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar
          userName={userName}
          userEmail={userEmail}
          role={role}
          resumeStatus={resumeStatus}
        />

        {/* Content column: TopBar (desktop) + scrollable page area */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppTopBar
            userName={userName}
            userEmail={userEmail}
            role={role}
            notificationsInitial={notificationsInitial}
          />

          <main className="flex-1 overflow-y-auto pt-[72px] md:pt-0">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
