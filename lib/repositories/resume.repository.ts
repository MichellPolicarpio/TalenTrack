import { sql, runWithPool } from "@/lib/db";
import { encryptData, decryptData } from "@/lib/crypto";
import type {
  Resume,
  ResumeStatus,
  ResumeProfile,
  ResumeWithProfile,
  UpdateProfileInput,
  FullResumeData,
  ResumeSnapshot,
  ResumeSnapshotMeta,
} from "@/lib/db/types";
import { RESUME_STATUS } from "@/lib/db/types";
import {
  getWorkExperiencesByResumeId,
  getEducationByResumeId,
  getSkillsByResumeId,
  getCertificationsByResumeId,
  getProjectsByResumeId,
  mapWorkExperience,
  mapEducation,
  mapSkill,
  mapCertification,
  mapAchievement,
  mapProject,
  mapLicense,
  resolveAchievementsTableName,
} from "@/lib/repositories/sections.repository";

function mapResume(row: Record<string, unknown>): Resume {
  return {
    id: String(row.ResumeId),
    employeeId: String(row.EmployeeId),
    status: String(row.Status ?? RESUME_STATUS.DRAFT) as ResumeStatus,
    reminderMonths: Number(row.ReminderMonths),
    submittedAt: row.SubmittedAt ? new Date(row.SubmittedAt as string) : null,
    reviewedAt: row.ReviewedAt ? new Date(row.ReviewedAt as string) : null,
    reviewedBy: row.ReviewedBy ? String(row.ReviewedBy) : null,
    reviewerNotes: row.ReviewerNotes ? String(row.ReviewerNotes) : null,
    lastApprovedAt: row.LastApprovedAt
      ? new Date(row.LastApprovedAt as string)
      : null,
    publicShareToken: row.PublicShareToken ? String(row.PublicShareToken) : null,
    isPublicLinkActive: Boolean(row.IsPublicLinkActive),
    version: Number(row.Version ?? 1),
    createdAt: row.ResumeCreatedAt as Date,
    updatedAt: row.ResumeUpdatedAt as Date,
  };
}

async function mapProfile(row: Record<string, unknown>): Promise<ResumeProfile | null> {
  if (row.ProfileId == null) {
    return null;
  }
  const [summary, address, phone, email] = await Promise.all([
    row.ProfessionalSummary == null ? null : decryptData(String(row.ProfessionalSummary)),
    row.HomeAddress == null ? null : decryptData(String(row.HomeAddress)),
    row.PersonalPhone == null ? null : decryptData(String(row.PersonalPhone)),
    row.PersonalEmail == null ? null : decryptData(String(row.PersonalEmail)),
  ]);

  return {
    id: String(row.ProfileId),
    resumeId: String(row.ProfileResumeId),
    jobTitle: row.JobTitle == null ? null : String(row.JobTitle),
    professionalSummary: summary,
    homeAddress: address,
    personalPhone: phone,
    personalEmail: email,
    createdAt: row.ProfileCreatedAt as Date,
    updatedAt: row.ProfileUpdatedAt as Date,
  };
}

export async function getResumeByEmployeeId(
  employeeId: string,
): Promise<ResumeWithProfile | null> {
  return runWithPool(async (pool) => {
    const request = pool.request();
    request.input("employeeId", sql.UniqueIdentifier, employeeId);

    const result = await request.query(`
      SELECT
        CAST(r.Id AS NVARCHAR(36)) AS ResumeId,
        CAST(r.EmployeeId AS NVARCHAR(36)) AS EmployeeId,
        r.Status,
        r.ReminderMonths,
        r.SubmittedAt,
        r.ReviewedAt,
        CAST(r.ReviewedBy AS NVARCHAR(36)) AS ReviewedBy,
        r.ReviewerNotes,
        r.LastApprovedAt,
        CAST(r.PublicShareToken AS NVARCHAR(36)) AS PublicShareToken,
        r.IsPublicLinkActive,
        r.Version,
        r.CreatedAt AS ResumeCreatedAt,
        r.UpdatedAt AS ResumeUpdatedAt,
        CAST(p.Id AS NVARCHAR(36)) AS ProfileId,
        CAST(p.ResumeId AS NVARCHAR(36)) AS ProfileResumeId,
        p.ProfessionalSummary,
        p.JobTitle,
        p.HomeAddress,
        p.PersonalPhone,
        p.PersonalEmail,
        p.CreatedAt AS ProfileCreatedAt,
        p.UpdatedAt AS ProfileUpdatedAt
      FROM dbo.Resumes r
      LEFT JOIN dbo.ResumeProfiles p ON p.ResumeId = r.Id
      WHERE r.EmployeeId = @employeeId
    `);

    const row = result.recordset[0] as Record<string, unknown> | undefined;
    if (!row) {
      return null;
    }

    return {
      resume: mapResume(row),
      profile: await mapProfile(row),
    };
  });
}

export async function getResumeById(
  resumeId: string,
): Promise<ResumeWithProfile | null> {
  return runWithPool(async (pool) => {
    const request = pool.request();
    request.input("resumeId", sql.UniqueIdentifier, resumeId);

    const result = await request.query(`
      SELECT
        CAST(r.Id AS NVARCHAR(36)) AS ResumeId,
        CAST(r.EmployeeId AS NVARCHAR(36)) AS EmployeeId,
        r.Status,
        r.ReminderMonths,
        r.SubmittedAt,
        r.ReviewedAt,
        CAST(r.ReviewedBy AS NVARCHAR(36)) AS ReviewedBy,
        r.ReviewerNotes,
        r.LastApprovedAt,
        CAST(r.PublicShareToken AS NVARCHAR(36)) AS PublicShareToken,
        r.IsPublicLinkActive,
        r.Version,
        r.CreatedAt AS ResumeCreatedAt,
        r.UpdatedAt AS ResumeUpdatedAt,
        CAST(p.Id AS NVARCHAR(36)) AS ProfileId,
        CAST(p.ResumeId AS NVARCHAR(36)) AS ProfileResumeId,
        p.ProfessionalSummary,
        p.JobTitle,
        p.HomeAddress,
        p.PersonalPhone,
        p.PersonalEmail,
        p.CreatedAt AS ProfileCreatedAt,
        p.UpdatedAt AS ProfileUpdatedAt
      FROM dbo.Resumes r
      LEFT JOIN dbo.ResumeProfiles p ON p.ResumeId = r.Id
      WHERE r.Id = @resumeId
    `);

    const row = result.recordset[0] as Record<string, unknown> | undefined;
    if (!row) {
      return null;
    }

    return {
      resume: mapResume(row),
      profile: await mapProfile(row),
    };
  });
}

/**
 * Bumps `Resumes.UpdatedAt` after a content change (profile or sections).
 * If the resume was `APPROVED`, it becomes `DRAFT`, the public share link is
 * deactivated (`IsPublicLinkActive = 0`), and an audit row records the
 * invalidation so HR sees a clear trail.
 *
 * Use `shouldInvalidateApproval = false` for minor changes like visibility toggles
 * that shouldn't reset the status back to DRAFT or kill the public link.
 *
 * @returns `true` when approval was cleared (was `APPROVED` before this call).
 */
export async function touchResumeUpdatedAt(
  resumeId: string,
  actorEmployeeId: string,
  shouldInvalidateApproval: boolean = true,
): Promise<boolean> {
  return runWithPool(async (pool) => {
    let wasApproved = false;

    if (shouldInvalidateApproval) {
      const pre = pool.request();
      pre.input("resumeId", sql.UniqueIdentifier, resumeId);
      const preRes = await pre.query(`
        SELECT CASE WHEN Status = N'${RESUME_STATUS.APPROVED}' THEN 1 ELSE 0 END AS WasApproved
        FROM dbo.Resumes WHERE Id = @resumeId
      `);
      wasApproved = Boolean(preRes.recordset[0]?.WasApproved);
    }

    const upd = pool.request();
    upd.input("resumeId", sql.UniqueIdentifier, resumeId);
    upd.input("shouldInvalidateApproval", sql.Bit, shouldInvalidateApproval ? 1 : 0);
    await upd.query(`
      UPDATE dbo.Resumes
      SET
        UpdatedAt = SYSUTCDATETIME(),
        Status = CASE WHEN @shouldInvalidateApproval = 1 AND Status = N'${RESUME_STATUS.APPROVED}' THEN N'${RESUME_STATUS.DRAFT}' ELSE Status END,
        IsPublicLinkActive = CASE WHEN @shouldInvalidateApproval = 1 AND Status = N'${RESUME_STATUS.APPROVED}' THEN 0 ELSE IsPublicLinkActive END
      WHERE Id = @resumeId
    `);

    if (shouldInvalidateApproval && wasApproved) {
      const ins = pool.request();
      ins.input("resumeId", sql.UniqueIdentifier, resumeId);
      ins.input("actorEmployeeId", sql.UniqueIdentifier, actorEmployeeId);
      await ins.query(`
        INSERT INTO dbo.ApprovalAuditLog (Id, ResumeId, ActorId, FromStatus, ToStatus, Notes, CreatedAt)
        VALUES (
          NEWID(),
          @resumeId,
          @actorEmployeeId,
          N'${RESUME_STATUS.APPROVED}',
          N'${RESUME_STATUS.DRAFT}',
          N'Approval invalidated: resume content was edited by the employee. Public share link deactivated until the next approval.',
          SYSDATETIMEOFFSET()
        )
      `);
    }

    return wasApproved;
  });
}

export async function saveResumeSnapshot(
  resumeId: string,
  version: number,
  data: FullResumeData,
): Promise<void> {
  return runWithPool(async (pool) => {
    const request = pool.request();
    request.input("resumeId", sql.UniqueIdentifier, resumeId);
    request.input("version", sql.Int, version);
    request.input("snapshotData", sql.NVarChar(sql.MAX), JSON.stringify(data));

    await request.query(`
      INSERT INTO dbo.ResumeSnapshots (ResumeId, Version, SnapshotData)
      VALUES (@resumeId, @version, @snapshotData)
    `);
  });
}

export async function getResumeSnapshots(
  resumeId: string,
): Promise<ResumeSnapshot[]> {
  return runWithPool(async (pool) => {
    const request = pool.request();
    request.input("resumeId", sql.UniqueIdentifier, resumeId);

    const result = await request.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        Version,
        SnapshotData,
        CreatedAt
      FROM dbo.ResumeSnapshots
      WHERE ResumeId = @resumeId
      ORDER BY Version DESC
    `);

    return (result.recordset as Record<string, unknown>[]).map((row) => ({
      id: String(row.Id),
      resumeId: String(row.ResumeId),
      version: Number(row.Version),
      snapshotData: JSON.parse(String(row.SnapshotData)),
      createdAt: new Date(row.CreatedAt as string),
    }));
  });
}

export async function getResumeSnapshotsMeta(
  resumeId: string,
): Promise<ResumeSnapshotMeta[]> {
  return runWithPool(async (pool) => {
    const request = pool.request();
    request.input("resumeId", sql.UniqueIdentifier, resumeId);

    const result = await request.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        Version,
        CreatedAt,
        JSON_VALUE(SnapshotData, '$.profile.jobTitle') AS JobTitle,
        JSON_VALUE(SnapshotData, '$.profile.professionalSummary') AS ProfessionalSummary,
        JSON_QUERY(SnapshotData, '$.workExperiences') AS WorkExpArr,
        JSON_QUERY(SnapshotData, '$.education') AS EduArr,
        JSON_QUERY(SnapshotData, '$.skills') AS SkillsArr
      FROM dbo.ResumeSnapshots
      WHERE ResumeId = @resumeId
      ORDER BY Version DESC
    `);

    return (result.recordset as Record<string, unknown>[]).map((row) => {
      // Basic count parsing from JSON strings (hacky but avoids full JSON.parse for the whole object)
      const countItems = (json: any) => {
        if (!json) return 0;
        try {
          const arr = JSON.parse(json);
          return Array.isArray(arr) ? arr.length : 0;
        } catch { return 0; }
      };

      return {
        id: String(row.Id),
        resumeId: String(row.ResumeId),
        version: Number(row.Version),
        createdAt: new Date(row.CreatedAt as string),
        jobTitle: row.JobTitle ? String(row.JobTitle) : null,
        professionalSummary: row.ProfessionalSummary ? String(row.ProfessionalSummary) : null,
        counts: {
          experiences: countItems(row.WorkExpArr),
          education: countItems(row.EduArr),
          skills: countItems(row.SkillsArr),
        }
      };
    });
  });
}

export async function getResumeSnapshotById(
  snapshotId: string,
): Promise<ResumeSnapshot | null> {
  return runWithPool(async (pool) => {
    const request = pool.request();
    request.input("snapshotId", sql.UniqueIdentifier, snapshotId);

    const result = await request.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        Version,
        SnapshotData,
        CreatedAt
      FROM dbo.ResumeSnapshots
      WHERE Id = @snapshotId
    `);

    const row = result.recordset[0] as Record<string, unknown> | undefined;
    if (!row) return null;

    return {
      id: String(row.Id),
      resumeId: String(row.ResumeId),
      version: Number(row.Version),
      snapshotData: JSON.parse(String(row.SnapshotData)),
      createdAt: new Date(row.CreatedAt as string),
    };
  });
}

export async function createResumeWithProfile(
  employeeId: string,
  reminderMonths: number,
): Promise<string> {
  return runWithPool(async (pool) => {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const insResume = new sql.Request(transaction);
      insResume.input("employeeId", sql.UniqueIdentifier, employeeId);
      insResume.input("reminderMonths", sql.TinyInt, reminderMonths);

      const resumeInsert = await insResume.query(`
        INSERT INTO dbo.Resumes (
          Id,
          EmployeeId,
          Status,
          ReminderMonths,
          CreatedAt,
          UpdatedAt
        )
        OUTPUT CAST(INSERTED.Id AS NVARCHAR(36)) AS Id
        VALUES (
          NEWID(),
          @employeeId,
          '${RESUME_STATUS.DRAFT}',
          @reminderMonths,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        )
      `);

      const resumeRow = resumeInsert.recordset[0] as { Id: string } | undefined;
      if (!resumeRow?.Id) {
        throw new Error("Failed to create resume");
      }

      const resumeId = resumeRow.Id;

      const insProfile = new sql.Request(transaction);
      insProfile.input("resumeId", sql.UniqueIdentifier, resumeId);
      await insProfile.query(`
        INSERT INTO dbo.ResumeProfiles (
          Id,
          ResumeId,
          CreatedAt,
          UpdatedAt
        )
        VALUES (
          NEWID(),
          @resumeId,
          SYSUTCDATETIME(),
          SYSUTCDATETIME()
        )
      `);

      await transaction.commit();
      return resumeId;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  });
}

export async function updateResumeProfile(
  resumeId: string,
  data: UpdateProfileInput,
): Promise<void> {
  return runWithPool(async (pool) => {
    /**
     * msnodesqlv8 + Always Encrypted: binding NULL for optional nvarchar params can make ODBC
     * describe them as char(1), breaking sp_describe_parameter_encryption. Use "" instead of null
     * for optional encrypted strings (semantically "no value" for the UI).
     */
    const optEncStr = async (v: string | null | undefined, maxLen: number): Promise<string> => {
      if (v == null) return "";
      const t = String(v).trim();
      if (t === "") return "";
      const truncated = t.length > maxLen ? t.slice(0, maxLen) : t;
      const crypted = await encryptData(truncated);
      return crypted ?? "";
    };

    const jobTitle = String(data.jobTitle ?? "").trim();
    if (!jobTitle) {
      throw new Error("Job title is required");
    }

    const request = pool.request();
    request.input("resumeId", sql.UniqueIdentifier, resumeId);
    request.input(
      "jobTitle",
      sql.NVarChar(200),
      jobTitle.length > 200 ? jobTitle.slice(0, 200) : jobTitle,
    );
    request.input(
      "professionalSummary",
      sql.NVarChar(sql.MAX),
      await optEncStr(data.professionalSummary, 65535),
    );
    request.input("homeAddress", sql.NVarChar(sql.MAX), await optEncStr(data.homeAddress, 500));
    request.input("personalPhone", sql.NVarChar(sql.MAX), await optEncStr(data.personalPhone, 50));
    request.input(
      "personalEmail",
      sql.NVarChar(sql.MAX),
      await optEncStr(data.personalEmail, 320),
    );

    await request.query(`
      UPDATE dbo.ResumeProfiles
      SET
        JobTitle = @jobTitle,
        ProfessionalSummary = @professionalSummary,
        HomeAddress = @homeAddress,
        PersonalPhone = @personalPhone,
        PersonalEmail = @personalEmail,
        UpdatedAt = SYSUTCDATETIME()
      WHERE ResumeId = @resumeId
    `);
  });
}

export async function updateResumeReminderMonths(
  resumeId: string,
  reminderMonths: number,
): Promise<void> {
  return runWithPool(async (pool) => {
    const request = pool.request();
    request.input("resumeId", sql.UniqueIdentifier, resumeId);
    request.input("reminderMonths", sql.TinyInt, reminderMonths);

    await request.query(`
      UPDATE dbo.Resumes
      SET
        ReminderMonths = @reminderMonths,
        UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @resumeId
    `);
  });
}

export async function isResumeOwnedByEmployee(
  resumeId: string,
  employeeId: string,
): Promise<boolean> {
  return runWithPool(async (pool) => {
    const request = pool.request();
    request.input("resumeId", sql.UniqueIdentifier, resumeId);
    request.input("employeeId", sql.UniqueIdentifier, employeeId);

    const result = await request.query(`
      SELECT 1 AS Ok
      FROM dbo.Resumes
      WHERE Id = @resumeId AND EmployeeId = @employeeId
    `);

    return result.recordset.length > 0;
  });
}

// ─── PDF export aggregate ────────────────────────────────────────────────────

export async function getFullResumeForPdf(
  resumeId: string,
): Promise<FullResumeData | null> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);

    const result = await req.query(`
      -- 0: Employee + Profile
      SELECT
        e.DisplayName,
        e.CorporateEmail,
        CAST(p.Id AS NVARCHAR(36))       AS ProfileId,
        CAST(p.ResumeId AS NVARCHAR(36)) AS ProfileResumeId,
        p.ProfessionalSummary,
        p.JobTitle,
        p.HomeAddress,
        p.PersonalPhone,
        p.PersonalEmail,
        p.CreatedAt AS ProfileCreatedAt,
        p.UpdatedAt AS ProfileUpdatedAt
      FROM dbo.Resumes r
      JOIN dbo.Employees e ON e.Id = r.EmployeeId
      LEFT JOIN dbo.ResumeProfiles p ON p.ResumeId = r.Id
      WHERE r.Id = @resumeId;

      -- 1: WorkExperiences
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        CompanyName, JobTitle, Location, StartDate, EndDate, IsCurrent, Description, SortOrder, IsVisibleOnResume
      FROM dbo.WorkExperiences WHERE ResumeId = @resumeId AND IsVisibleOnResume = 1 ORDER BY SortOrder ASC;

      -- 2: Education
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        InstitutionName, Degree, DegreeType, Specialization, StartYear, EndYear, IsOngoing, SortOrder, IsVisibleOnResume
      FROM dbo.Education WHERE ResumeId = @resumeId AND IsVisibleOnResume = 1 ORDER BY SortOrder ASC;

      -- 3: Skills
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        SkillName, SortOrder, IsVisibleOnResume
      FROM dbo.Skills WHERE ResumeId = @resumeId AND IsVisibleOnResume = 1 ORDER BY SortOrder ASC;

      -- 4: Certifications
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        CertificationName, IssuingOrganization, IssueDate, ExpirationDate, CredentialId, SortOrder, IsVisibleOnResume
      FROM dbo.Certifications WHERE ResumeId = @resumeId AND IsVisibleOnResume = 1 ORDER BY SortOrder ASC;

      -- 5: Projects
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        ProjectName, Industry, Role, ProjectValue, Year, ExpandedTitle, Description, SortOrder, IsVisibleOnResume
      FROM dbo.ResumeProjects WHERE ResumeId = @resumeId AND IsVisibleOnResume = 1 ORDER BY SortOrder ASC;
    `);

    const rss = result.recordsets as any;
    const profileRow = rss[0]?.[0];
    if (!profileRow) return null;

    return {
      employee: {
        displayName: String(profileRow.DisplayName ?? ""),
        corporateEmail: String(profileRow.CorporateEmail ?? ""),
      },
      profile: await mapProfile(profileRow),
      workExperiences: (rss[1] || []).map(mapWorkExperience),
      education: (rss[2] || []).map(mapEducation),
      skills: (rss[3] || []).map(mapSkill),
      certifications: (rss[4] || []).map(mapCertification),
      projects: (rss[5] || []).map(mapProject),
      achievements: [],
      licenses: []
    };
  });
}

/**
 * Fetches all resume tables in a SINGLE database roundtrip.
 * Uses multiple SELECT statements to avoid 8+ network calls.
 */
export async function getResumeAllDataForEditor(resumeId: string) {
  return runWithPool(async (pool) => {
    const achTableName = await resolveAchievementsTableName(pool);

    const request = pool.request();
    request.input("resumeId", sql.UniqueIdentifier, resumeId);

    const result = await request.query(`
      -- 0: Resume + Profile
      SELECT
        CAST(r.Id AS NVARCHAR(36)) AS ResumeId,
        CAST(r.EmployeeId AS NVARCHAR(36)) AS EmployeeId,
        r.Status,
        r.ReminderMonths,
        r.SubmittedAt,
        r.ReviewedAt,
        CAST(r.ReviewedBy AS NVARCHAR(36)) AS ReviewedBy,
        r.ReviewerNotes,
        r.LastApprovedAt,
        CAST(r.PublicShareToken AS NVARCHAR(36)) AS PublicShareToken,
        r.IsPublicLinkActive,
        r.Version,
        r.CreatedAt AS ResumeCreatedAt,
        r.UpdatedAt AS ResumeUpdatedAt,
        CAST(p.Id AS NVARCHAR(36)) AS ProfileId,
        CAST(p.ResumeId AS NVARCHAR(36)) AS ProfileResumeId,
        p.ProfessionalSummary,
        p.JobTitle,
        p.HomeAddress,
        p.PersonalPhone,
        p.PersonalEmail,
        p.CreatedAt AS ProfileCreatedAt,
        p.UpdatedAt AS ProfileUpdatedAt
      FROM dbo.Resumes r
      LEFT JOIN dbo.ResumeProfiles p ON p.ResumeId = r.Id
      WHERE r.Id = @resumeId;

      -- 1: WorkExperiences
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        CompanyName, JobTitle, Location, StartDate, EndDate, IsCurrent, Description, SortOrder, IsVisibleOnResume
      FROM dbo.WorkExperiences WHERE ResumeId = @resumeId ORDER BY SortOrder ASC;

      -- 2: Education
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        InstitutionName, Degree, DegreeType, Specialization, StartYear, EndYear, IsOngoing, SortOrder, IsVisibleOnResume
      FROM dbo.Education WHERE ResumeId = @resumeId ORDER BY SortOrder ASC;

      -- 3: Skills
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        SkillName, SortOrder, IsVisibleOnResume
      FROM dbo.Skills WHERE ResumeId = @resumeId ORDER BY SortOrder ASC;

      -- 4: Certifications
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        CertificationName, IssuingOrganization, IssueDate, ExpirationDate, CredentialId, SortOrder, IsVisibleOnResume
      FROM dbo.Certifications WHERE ResumeId = @resumeId ORDER BY SortOrder ASC;

      -- 5: Achievements
      ${achTableName 
        ? `SELECT CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId, Year, Title, Organization, Description, SortOrder, IsVisibleOnResume FROM dbo.${achTableName} WHERE ResumeId = @resumeId ORDER BY SortOrder ASC;` 
        : `SELECT 1 AS _Dummy WHERE 1=0;`
      }

      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        ProjectName, Industry, Role, ProjectValue, Year, ExpandedTitle, Description, SortOrder, IsVisibleOnResume
      FROM dbo.ResumeProjects WHERE ResumeId = @resumeId ORDER BY SortOrder ASC;

      -- 7: Licenses
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id, CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        LicenseType, Jurisdiction, LicenseNumber, ExpirationDate, IsRetired, SortOrder, IsVisibleOnResume
      FROM dbo.Licenses WHERE ResumeId = @resumeId ORDER BY SortOrder ASC;
    `);

    const rs = result.recordsets as unknown as Record<string, unknown>[][];
    const row = rs[0]?.[0];
    const resumeWithProfile = row ? { resume: mapResume(row), profile: await mapProfile(row) } : null;

    return {
      resumeWithProfile,
      experiences: (rs[1] || []).map(mapWorkExperience),
      education: (rs[2] || []).map(mapEducation),
      skills: (rs[3] || []).map(mapSkill),
      certifications: (rs[4] || []).map(mapCertification),
      achievements: (rs[5] || []).map(mapAchievement),
      projects: (rs[6] || []).map(mapProject),
      licenses: (rs[7] || []).map(mapLicense),
    };
  });
}
