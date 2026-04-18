import { sql, runWithPool } from "@/lib/db";
import type { AppNotification, AppNotificationType } from "@/lib/db/types";

function mapRow(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.Id),
    employeeId: String(row.EmployeeId),
    resumeId:
      row.ResumeId != null && row.ResumeId !== ""
        ? String(row.ResumeId)
        : null,
    type: String(row.Type) as AppNotificationType,
    message: String(row.Message ?? ""),
    isRead: Boolean(row.IsRead),
    createdAt: new Date(row.CreatedAt as string),
  };
}

export async function createNotification(params: {
  employeeId: string;
  resumeId: string | null;
  type: AppNotificationType;
  message: string;
}): Promise<void> {
  const message =
    params.message.length > 500
      ? `${params.message.slice(0, 497)}…`
      : params.message;

  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("employeeId", sql.UniqueIdentifier, params.employeeId);
    req.input("resumeId", sql.UniqueIdentifier, params.resumeId);
    req.input("type", sql.NVarChar(50), params.type);
    req.input("message", sql.NVarChar(500), message);

    await req.query(`
      INSERT INTO dbo.Notifications (Id, EmployeeId, ResumeId, Type, Message, IsRead, CreatedAt)
      VALUES (NEWID(), @employeeId, @resumeId, @type, @message, 0, SYSDATETIMEOFFSET())
    `);
  });
}

export async function getUnreadNotificationCount(
  employeeId: string,
): Promise<number> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("employeeId", sql.UniqueIdentifier, employeeId);
    const result = await req.query(`
      SELECT COUNT(*) AS Cnt
      FROM dbo.Notifications
      WHERE EmployeeId = @employeeId AND IsRead = 0
    `);
    const row = result.recordset[0] as { Cnt: number } | undefined;
    return Number(row?.Cnt ?? 0);
  });
}

export async function listNotificationsForEmployee(
  employeeId: string,
  limit: number,
): Promise<AppNotification[]> {
  const top = Math.floor(Math.min(Math.max(limit, 1), 50));
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("employeeId", sql.UniqueIdentifier, employeeId);

    const result = await req.query(`
      SELECT TOP (${top})
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(EmployeeId AS NVARCHAR(36)) AS EmployeeId,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        Type,
        Message,
        IsRead,
        CreatedAt
      FROM dbo.Notifications
      WHERE EmployeeId = @employeeId
      ORDER BY CreatedAt DESC
    `);

    return (result.recordset as Record<string, unknown>[]).map(mapRow);
  });
}

export async function markNotificationRead(
  notificationId: string,
  employeeId: string,
): Promise<boolean> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("id", sql.UniqueIdentifier, notificationId);
    req.input("employeeId", sql.UniqueIdentifier, employeeId);
    const result = await req.query(`
      UPDATE dbo.Notifications
      SET IsRead = 1
      WHERE Id = @id AND EmployeeId = @employeeId
    `);
    return (result.rowsAffected[0] ?? 0) > 0;
  });
}

export async function markAllNotificationsRead(
  employeeId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("employeeId", sql.UniqueIdentifier, employeeId);
    await req.query(`
      UPDATE dbo.Notifications
      SET IsRead = 1
      WHERE EmployeeId = @employeeId AND IsRead = 0
    `);
  });
}
