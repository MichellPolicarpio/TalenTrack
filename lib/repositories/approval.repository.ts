import { sql, runWithPool } from "@/lib/db";
import type {
  AuditLogEntry,
  ResumeQueueItem,
  ResumeStatus,
} from "@/lib/db/types";

export async function submitResumeForApproval(
  resumeId: string,
  actorId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    req.input("actorId", sql.UniqueIdentifier, actorId);

    await req.query(`
      DECLARE @fromStatus NVARCHAR(50);
      SELECT @fromStatus = Status FROM dbo.Resumes WHERE Id = @resumeId;

      UPDATE dbo.Resumes
      SET
        Status = 'PENDING_APPROVAL',
        SubmittedAt = SYSDATETIMEOFFSET(),
        UpdatedAt = SYSDATETIMEOFFSET()
      WHERE Id = @resumeId
        AND Status IN ('DRAFT', 'NEEDS_CHANGES');

      IF @@ROWCOUNT = 0
        THROW 50001, 'Resume cannot be submitted from its current status.', 1;

      INSERT INTO dbo.ApprovalAuditLog (Id, ResumeId, ActorId, FromStatus, ToStatus, CreatedAt)
      VALUES (NEWID(), @resumeId, @actorId, @fromStatus, 'PENDING_APPROVAL', SYSDATETIMEOFFSET());
    `);
  });
}

/** El empleado retira el envío antes de que HR decida: vuelve a DRAFT y puede editar de nuevo. */
export async function withdrawSubmissionForReview(
  resumeId: string,
  actorId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    req.input("actorId", sql.UniqueIdentifier, actorId);

    await req.query(`
      DECLARE @fromStatus NVARCHAR(50);
      SELECT @fromStatus = Status FROM dbo.Resumes WHERE Id = @resumeId;

      UPDATE dbo.Resumes
      SET
        Status = 'DRAFT',
        SubmittedAt = NULL,
        UpdatedAt = SYSDATETIMEOFFSET()
      WHERE Id = @resumeId
        AND Status = 'PENDING_APPROVAL';

      IF @@ROWCOUNT = 0
        THROW 50004, 'Resume is not pending approval; withdrawal is not allowed.', 1;

      INSERT INTO dbo.ApprovalAuditLog (Id, ResumeId, ActorId, FromStatus, ToStatus, CreatedAt)
      VALUES (NEWID(), @resumeId, @actorId, @fromStatus, 'DRAFT', SYSDATETIMEOFFSET());
    `);
  });
}

export async function approveResume(
  resumeId: string,
  reviewerId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    req.input("reviewerId", sql.UniqueIdentifier, reviewerId);

    await req.query(`
      DECLARE @fromStatus NVARCHAR(50);
      SELECT @fromStatus = Status FROM dbo.Resumes WHERE Id = @resumeId;

      UPDATE dbo.Resumes
      SET
        Status = 'APPROVED',
        ReviewedAt = SYSDATETIMEOFFSET(),
        ReviewedBy = @reviewerId,
        LastApprovedAt = SYSDATETIMEOFFSET(),
        PublicShareToken = ISNULL(PublicShareToken, NEWID()),
        IsPublicLinkActive = 1,
        Version = Version + 1,
        UpdatedAt = SYSDATETIMEOFFSET()
      WHERE Id = @resumeId
        AND Status = 'PENDING_APPROVAL';

      IF @@ROWCOUNT = 0
        THROW 50002, 'Resume is not in PENDING_APPROVAL status.', 1;

      INSERT INTO dbo.ApprovalAuditLog (Id, ResumeId, ActorId, FromStatus, ToStatus, CreatedAt)
      VALUES (NEWID(), @resumeId, @reviewerId, @fromStatus, 'APPROVED', SYSDATETIMEOFFSET());
    `);
  });
}

export async function reopenResumeForEdit(
  resumeId: string,
  actorId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    req.input("actorId", sql.UniqueIdentifier, actorId);

    await req.query(`
      DECLARE @fromStatus NVARCHAR(50);
      SELECT @fromStatus = Status FROM dbo.Resumes WHERE Id = @resumeId;

      UPDATE dbo.Resumes
      SET
        Status = 'DRAFT',
        UpdatedAt = SYSDATETIMEOFFSET()
      WHERE Id = @resumeId
        AND Status = 'APPROVED';

      IF @@ROWCOUNT = 0
        THROW 50005, 'Resume is not in APPROVED status.', 1;

      INSERT INTO dbo.ApprovalAuditLog (Id, ResumeId, ActorId, FromStatus, ToStatus, Notes, CreatedAt)
      VALUES (
        NEWID(), 
        @resumeId, 
        @actorId, 
        @fromStatus, 
        'DRAFT', 
        N'Resume reopened for update by owner. Previous approved version archived.', 
        SYSDATETIMEOFFSET()
      );
    `);
  });
}

export async function requestChanges(
  resumeId: string,
  reviewerId: string,
  notes: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    req.input("reviewerId", sql.UniqueIdentifier, reviewerId);
    req.input("notes", sql.NVarChar(2000), notes);

    await req.query(`
      DECLARE @fromStatus NVARCHAR(50);
      SELECT @fromStatus = Status FROM dbo.Resumes WHERE Id = @resumeId;

      UPDATE dbo.Resumes
      SET
        Status = 'NEEDS_CHANGES',
        ReviewedAt = SYSDATETIMEOFFSET(),
        ReviewedBy = @reviewerId,
        ReviewerNotes = @notes,
        UpdatedAt = SYSDATETIMEOFFSET()
      WHERE Id = @resumeId
        AND Status = 'PENDING_APPROVAL';

      IF @@ROWCOUNT = 0
        THROW 50003, 'Resume is not in PENDING_APPROVAL status.', 1;

      INSERT INTO dbo.ApprovalAuditLog (Id, ResumeId, ActorId, FromStatus, ToStatus, Notes, CreatedAt)
      VALUES (NEWID(), @resumeId, @reviewerId, @fromStatus, 'NEEDS_CHANGES', @notes, SYSDATETIMEOFFSET());
    `);
  });
}

export async function getAllPendingResumes(): Promise<ResumeQueueItem[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    const result = await req.query(`
      SELECT
        CAST(r.Id AS NVARCHAR(36)) AS ResumeId,
        CAST(r.EmployeeId AS NVARCHAR(36)) AS EmployeeId,
        e.DisplayName AS EmployeeName,
        e.CorporateEmail AS EmployeeEmail,
        p.JobTitle,
        r.SubmittedAt,
        r.Version
      FROM dbo.Resumes r
      JOIN dbo.Employees e ON e.Id = r.EmployeeId
      LEFT JOIN dbo.ResumeProfiles p ON p.ResumeId = r.Id
      WHERE r.Status = 'PENDING_APPROVAL'
      ORDER BY r.SubmittedAt ASC
    `);

    return (result.recordset as Record<string, unknown>[]).map((row) => ({
      resumeId: String(row.ResumeId),
      employeeId: String(row.EmployeeId),
      employeeName: String(row.EmployeeName ?? ""),
      employeeEmail: String(row.EmployeeEmail ?? ""),
      jobTitle: row.JobTitle ? String(row.JobTitle) : null,
      submittedAt: new Date(row.SubmittedAt as string),
      version: Number(row.Version),
    }));
  });
}

export async function getAllApprovedResumes(limit?: number): Promise<ResumeQueueItem[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    const topClause = limit ? `TOP (${limit})` : "";
    const result = await req.query(`
      SELECT ${topClause}
        CAST(r.Id AS NVARCHAR(36)) AS ResumeId,
        CAST(r.EmployeeId AS NVARCHAR(36)) AS EmployeeId,
        e.DisplayName AS EmployeeName,
        e.CorporateEmail AS EmployeeEmail,
        p.JobTitle,
        r.SubmittedAt,
        r.Version
      FROM dbo.Resumes r
      JOIN dbo.Employees e ON e.Id = r.EmployeeId
      LEFT JOIN dbo.ResumeProfiles p ON p.ResumeId = r.Id
      WHERE r.Status = 'APPROVED'
      ORDER BY r.ReviewedAt DESC
    `);

    return (result.recordset as Record<string, unknown>[]).map((row) => ({
      resumeId: String(row.ResumeId),
      employeeId: String(row.EmployeeId),
      employeeName: String(row.EmployeeName ?? ""),
      employeeEmail: String(row.EmployeeEmail ?? ""),
      jobTitle: row.JobTitle ? String(row.JobTitle) : null,
      submittedAt: new Date(row.SubmittedAt as string),
      version: Number(row.Version),
    }));
  });
}

export async function getAllResumesHistory(): Promise<(ResumeQueueItem & { status: ResumeStatus })[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    const result = await req.query(`
      SELECT
        CAST(r.Id AS NVARCHAR(36)) AS ResumeId,
        CAST(r.EmployeeId AS NVARCHAR(36)) AS EmployeeId,
        e.DisplayName AS EmployeeName,
        e.CorporateEmail AS EmployeeEmail,
        p.JobTitle,
        r.SubmittedAt,
        r.Version,
        r.Status
      FROM dbo.Resumes r
      JOIN dbo.Employees e ON e.Id = r.EmployeeId
      LEFT JOIN dbo.ResumeProfiles p ON p.ResumeId = r.Id
      WHERE r.Status <> 'DRAFT'
      ORDER BY r.UpdatedAt DESC
    `);

    return (result.recordset as Record<string, unknown>[]).map((row) => ({
      resumeId: String(row.ResumeId),
      employeeId: String(row.EmployeeId),
      employeeName: String(row.EmployeeName ?? ""),
      employeeEmail: String(row.EmployeeEmail ?? ""),
      jobTitle: row.JobTitle ? String(row.JobTitle) : null,
      submittedAt: new Date(row.SubmittedAt as string),
      version: Number(row.Version),
      status: row.Status as ResumeStatus,
    }));
  });
}

export async function getAuditLogByResumeId(
  resumeId: string,
): Promise<AuditLogEntry[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);

    const result = await req.query(`
      SELECT
        CAST(a.Id AS NVARCHAR(36)) AS Id,
        CAST(a.ResumeId AS NVARCHAR(36)) AS ResumeId,
        CAST(a.ActorId AS NVARCHAR(36)) AS ActorId,
        e.DisplayName AS ActorName,
        a.FromStatus,
        a.ToStatus,
        a.Notes,
        a.CreatedAt
      FROM dbo.ApprovalAuditLog a
      JOIN dbo.Employees e ON e.Id = a.ActorId
      WHERE a.ResumeId = @resumeId
      ORDER BY a.CreatedAt DESC
    `);

    return (result.recordset as Record<string, unknown>[]).map((row) => ({
      id: String(row.Id),
      resumeId: String(row.ResumeId),
      actorId: String(row.ActorId),
      actorName: String(row.ActorName ?? ""),
      fromStatus: String(row.FromStatus) as ResumeStatus,
      toStatus: String(row.ToStatus) as ResumeStatus,
      notes: row.Notes ? String(row.Notes) : null,
      createdAt: new Date(row.CreatedAt as string),
    }));
  });
}

export async function getResumeByShareToken(token: string): Promise<string | null> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("token", sql.UniqueIdentifier, token);

    const result = await req.query(`
      SELECT CAST(Id AS NVARCHAR(36)) AS Id
      FROM dbo.Resumes
      WHERE PublicShareToken = @token
        AND IsPublicLinkActive = 1
    `);

    const row = result.recordset[0] as { Id: string } | undefined;
    return row?.Id ?? null;
  });
}

export async function getResumeWithEmployeeById(resumeId: string) {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);

    const result = await req.query(`
      SELECT
        CAST(r.Id AS NVARCHAR(36)) AS ResumeId,
        CAST(r.EmployeeId AS NVARCHAR(36)) AS EmployeeId,
        r.Status,
        r.SubmittedAt,
        r.ReviewerNotes,
        r.Version,
        e.DisplayName AS EmployeeName,
        e.CorporateEmail AS EmployeeEmail,
        p.JobTitle,
        p.ProfessionalSummary,
        CAST(r.PublicShareToken AS NVARCHAR(36)) AS PublicShareToken,
        r.IsPublicLinkActive
      FROM dbo.Resumes r
      JOIN dbo.Employees e ON e.Id = r.EmployeeId
      LEFT JOIN dbo.ResumeProfiles p ON p.ResumeId = r.Id
      WHERE r.Id = @resumeId
    `);

    const row = result.recordset[0] as Record<string, unknown> | undefined;
    if (!row) return null;

    return {
      resumeId: String(row.ResumeId),
      employeeId: String(row.EmployeeId),
      employeeName: String(row.EmployeeName ?? ""),
      employeeEmail: String(row.EmployeeEmail ?? ""),
      status: String(row.Status) as ResumeStatus,
      submittedAt: row.SubmittedAt ? new Date(row.SubmittedAt as string) : null,
      reviewerNotes: row.ReviewerNotes ? String(row.ReviewerNotes) : null,
      version: Number(row.Version),
      jobTitle: row.JobTitle ? String(row.JobTitle) : null,
      professionalSummary: row.ProfessionalSummary
        ? String(row.ProfessionalSummary)
        : null,
      publicShareToken: row.PublicShareToken ? String(row.PublicShareToken) : null,
      isPublicLinkActive: Boolean(row.IsPublicLinkActive),
    };
  });
}
