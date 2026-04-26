"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmployeeByEntraId } from "@/lib/repositories/employee.repository";
import {
  getUnreadNotificationCount,
  listNotificationsForEmployee,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/repositories/notifications.repository";

export type NotificationListItemDTO = {
  id: string;
  type: string;
  message: string;
  resumeId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsSnapshotDTO = {
  unreadCount: number;
  items: NotificationListItemDTO[];
};

function serialize(
  items: Awaited<ReturnType<typeof listNotificationsForEmployee>>,
): NotificationListItemDTO[] {
  return items.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    resumeId: n.resumeId,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));
}

async function requireEmployee() {
  const session = await auth();
  if (!session?.user?.entraObjectId) throw new Error("Unauthorized");
  const employee = await getEmployeeByEntraId(session.user.entraObjectId);
  if (!employee) throw new Error("Forbidden");
  return employee;
}

export async function getNotificationsSnapshotAction(): Promise<NotificationsSnapshotDTO | null> {
  const session = await auth();
  if (!session?.user?.entraObjectId) return null;
  const employee = await getEmployeeByEntraId(session.user.entraObjectId);
  if (!employee) return null;
  try {
    const [unreadCount, items] = await Promise.all([
      getUnreadNotificationCount(employee.id),
      listNotificationsForEmployee(employee.id, 12),
    ]);
    return { unreadCount, items: serialize(items) };
  } catch {
    return { unreadCount: 0, items: [] };
  }
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<void> {
  const employee = await requireEmployee();
  await markNotificationRead(notificationId, employee.id);
  revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const employee = await requireEmployee();
  await markAllNotificationsRead(employee.id);
  revalidatePath("/dashboard", "layout");
}
