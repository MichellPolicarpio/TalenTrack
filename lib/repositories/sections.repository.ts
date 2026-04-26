import { sql, runWithPool } from "@/lib/db";
import type {
  WorkExperience,
  WorkExperienceInput,
  Education,
  EducationInput,
  Skill,
  SkillInput,
  Certification,
  CertificationInput,
  Achievement,
  AchievementInput,
  Project,
  ProjectInput,
  License,
  LicenseInput,
  LicenseStatus,
  ReorderItem,
  ProficiencyLevel,
} from "@/lib/db/types";

// ─── Mappers ─────────────────────────────────────────────────────────────────

export function mapWorkExperience(row: Record<string, unknown>): WorkExperience {
  return {
    id: String(row.Id),
    resumeId: String(row.ResumeId),
    companyName: String(row.CompanyName),
    jobTitle: String(row.JobTitle),
    location: row.Location == null ? null : String(row.Location),
    startDate: row.StartDate == null ? null : new Date(row.StartDate as string),
    endDate: row.EndDate == null ? null : new Date(row.EndDate as string),
    isCurrent: Boolean(row.IsCurrent),
    description: row.Description == null ? null : String(row.Description),
    sortOrder: Number(row.SortOrder),
    isVisibleOnResume: row.IsVisibleOnResume == null ? true : Boolean(row.IsVisibleOnResume),
  };
}

export function mapEducation(row: Record<string, unknown>): Education {
  return {
    id: String(row.Id),
    resumeId: String(row.ResumeId),
    institutionName: String(row.InstitutionName),
    degree: String(row.Degree),
    degreeType: row.DegreeType == null ? null : String(row.DegreeType),
    specialization: row.Specialization == null ? null : String(row.Specialization),
    startYear: row.StartYear == null ? null : Number(row.StartYear),
    endYear: row.EndYear == null ? null : Number(row.EndYear),
    isOngoing: Boolean(row.IsOngoing),
    sortOrder: Number(row.SortOrder),
    isVisibleOnResume: row.IsVisibleOnResume == null ? true : Boolean(row.IsVisibleOnResume),
  };
}

export function mapSkill(row: Record<string, unknown>): Skill {
  return {
    id: String(row.Id),
    resumeId: String(row.ResumeId),
    skillName: String(row.SkillName),
    proficiencyLevel: (row.ProficiencyLevel as ProficiencyLevel | undefined) ?? "Intermediate",
    sortOrder: Number(row.SortOrder),
    isVisibleOnResume: row.IsVisibleOnResume == null ? true : Boolean(row.IsVisibleOnResume),
  };
}

export function mapCertification(row: Record<string, unknown>): Certification {
  return {
    id: String(row.Id),
    resumeId: String(row.ResumeId),
    certificationName: String(row.CertificationName),
    issuingOrganization:
      row.IssuingOrganization == null ? null : String(row.IssuingOrganization),
    issueDate: row.IssueDate == null ? null : new Date(row.IssueDate as string),
    expirationDate:
      row.ExpirationDate == null ? null : new Date(row.ExpirationDate as string),
    credentialId: row.CredentialId == null ? null : String(row.CredentialId),
    sortOrder: Number(row.SortOrder),
    isVisibleOnResume: row.IsVisibleOnResume == null ? true : Boolean(row.IsVisibleOnResume),
  };
}

export function mapAchievement(row: Record<string, unknown>): Achievement {
  return {
    id: String(row.Id),
    resumeId: String(row.ResumeId),
    year: row.Year == null ? null : Number(row.Year),
    title: String(row.Title),
    organization: row.Organization == null ? null : String(row.Organization),
    description: row.Description == null ? null : String(row.Description),
    sortOrder: Number(row.SortOrder),
    isVisibleOnResume: row.IsVisibleOnResume == null ? true : Boolean(row.IsVisibleOnResume),
  };
}

export function mapProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.Id),
    resumeId: String(row.ResumeId),
    projectName: String(row.ProjectName),
    industry: row.Industry == null ? null : String(row.Industry),
    role: row.Role == null ? null : String(row.Role),
    projectValue: row.ProjectValue == null ? null : String(row.ProjectValue),
    client: row.Client == null ? null : String(row.Client),
    year: row.Year == null ? null : Number(row.Year),
    expandedTitle: row.ExpandedTitle == null ? null : String(row.ExpandedTitle),
    description: row.Description == null ? null : String(row.Description),
    sortOrder: Number(row.SortOrder),
    isVisibleOnResume:
      row.IsVisibleOnResume == null ? true : Boolean(row.IsVisibleOnResume),
  };
}

export function mapLicense(row: Record<string, unknown>): License {
  const isRetired = Boolean(row.IsRetired);
  const expDate = row.ExpirationDate ? new Date(row.ExpirationDate as string) : null;
  
  let status: LicenseStatus = "Active";
  if (isRetired) {
    status = "Retired";
  } else if (expDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expDate < today) {
      status = "Inactive";
    }
  }

  return {
    id: String(row.Id),
    resumeId: String(row.ResumeId),
    licenseType: String(row.LicenseType),
    jurisdiction: String(row.Jurisdiction),
    licenseNumber: row.LicenseNumber == null ? null : String(row.LicenseNumber),
    expirationDate: expDate,
    isRetired,
    sortOrder: Number(row.SortOrder),
    isVisibleOnResume: row.IsVisibleOnResume == null ? true : Boolean(row.IsVisibleOnResume),
    status,
  };
}

const ACHIEVEMENT_TABLE_CANDIDATES = [
  "Achievements",
  "Achievement",
  "AchievementsAndAwards",
] as const;

let achievementsTableNameCache: string | null = null;

export async function resolveAchievementsTableName(
  pool: sql.ConnectionPool,
): Promise<string | null> {
  if (achievementsTableNameCache) {
    return achievementsTableNameCache;
  }

  const req = pool.request();
  const result = await req.query(`
    SELECT TOP 1 t.name AS TableName
    FROM sys.tables t
    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name = 'dbo'
      AND t.name IN ('Achievements', 'Achievement', 'AchievementsAndAwards')
    ORDER BY CASE t.name
      WHEN 'Achievements' THEN 1
      WHEN 'Achievement' THEN 2
      WHEN 'AchievementsAndAwards' THEN 3
      ELSE 99
    END
  `);

  const found = (result.recordset?.[0] as { TableName?: string } | undefined)
    ?.TableName;

  if (!found || !ACHIEVEMENT_TABLE_CANDIDATES.includes(found as never)) {
    achievementsTableNameCache = null;
    return null;
  }

  achievementsTableNameCache = found;
  return achievementsTableNameCache;
}

// ─── Work Experiences ────────────────────────────────────────────────────────

export async function getWorkExperiencesByResumeId(
  resumeId: string,
): Promise<WorkExperience[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    const result = await req.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        CompanyName, JobTitle, Location,
        StartDate, EndDate, IsCurrent,
        Description, SortOrder, IsVisibleOnResume
      FROM dbo.WorkExperiences
      WHERE ResumeId = @resumeId
      ORDER BY SortOrder ASC
    `);
    return (result.recordset as Record<string, unknown>[]).map(mapWorkExperience);
  });
}

export async function upsertWorkExperience(
  resumeId: string,
  data: WorkExperienceInput,
): Promise<void> {
  return runWithPool(async (pool) => {
    if (data.id) {
      const req = pool.request();
      req.input("id", sql.UniqueIdentifier, data.id);
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("companyName", sql.NVarChar(200), data.companyName);
      req.input("jobTitle", sql.NVarChar(200), data.jobTitle);
      req.input("location", sql.NVarChar(200), data.location);
      req.input("startDate", sql.Date, data.startDate ? new Date(data.startDate) : null);
      req.input("endDate", sql.Date, data.endDate ? new Date(data.endDate) : null);
      req.input("isCurrent", sql.Bit, data.isCurrent ? 1 : 0);
      req.input("description", sql.NVarChar(sql.MAX), data.description);
      await req.query(`
        UPDATE dbo.WorkExperiences SET
          CompanyName = @companyName,
          JobTitle = @jobTitle,
          Location = @location,
          StartDate = @startDate,
          EndDate = @endDate,
          IsCurrent = @isCurrent,
          Description = @description,
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id AND ResumeId = @resumeId
      `);
    } else {
      const req = pool.request();
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("companyName", sql.NVarChar(200), data.companyName);
      req.input("jobTitle", sql.NVarChar(200), data.jobTitle);
      req.input("location", sql.NVarChar(200), data.location);
      req.input("startDate", sql.Date, data.startDate ? new Date(data.startDate) : null);
      req.input("endDate", sql.Date, data.endDate ? new Date(data.endDate) : null);
      req.input("isCurrent", sql.Bit, data.isCurrent ? 1 : 0);
      req.input("description", sql.NVarChar(sql.MAX), data.description);
      await req.query(`
        INSERT INTO dbo.WorkExperiences (
          Id, ResumeId, CompanyName, JobTitle, Location,
          StartDate, EndDate, IsCurrent, Description,
          SortOrder, CreatedAt, UpdatedAt
        )
        VALUES (
          NEWID(), @resumeId, @companyName, @jobTitle, @location,
          @startDate, @endDate, @isCurrent, @description,
          (SELECT ISNULL(MAX(SortOrder), 0) + 1 FROM dbo.WorkExperiences WHERE ResumeId = @resumeId),
          SYSUTCDATETIME(), SYSUTCDATETIME()
        )
      `);
    }
  });
}

export async function deleteWorkExperience(
  id: string,
  resumeId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("id", sql.UniqueIdentifier, id);
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    await req.query(`
      DELETE FROM dbo.WorkExperiences
      WHERE Id = @id AND ResumeId = @resumeId
    `);
  });
}

export async function reorderWorkExperiences(
  items: ReorderItem[],
): Promise<void> {
  if (items.length === 0) return;
  return runWithPool(async (pool) => {
    const req = pool.request();
    let query = "";
    items.forEach((item, i) => {
      req.input(`id${i}`, sql.UniqueIdentifier, item.id);
      req.input(`so${i}`, sql.Int, item.sortOrder);
      query += `UPDATE dbo.WorkExperiences SET SortOrder = @so${i} WHERE Id = @id${i}; `;
    });
    await req.query(query);
  });
}

// ─── Education ───────────────────────────────────────────────────────────────

export async function getEducationByResumeId(
  resumeId: string,
): Promise<Education[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    const result = await req.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        InstitutionName, Degree, DegreeType, Specialization,
        StartYear, EndYear, IsOngoing, SortOrder, IsVisibleOnResume
      FROM dbo.Education
      WHERE ResumeId = @resumeId
      ORDER BY SortOrder ASC
    `);
    return (result.recordset as Record<string, unknown>[]).map(mapEducation);
  });
}

export async function upsertEducation(
  resumeId: string,
  data: EducationInput,
): Promise<void> {
  return runWithPool(async (pool) => {
    if (data.id) {
      const req = pool.request();
      req.input("id", sql.UniqueIdentifier, data.id);
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("institutionName", sql.NVarChar(200), data.institutionName);
      req.input("degree", sql.NVarChar(200), data.degree);
      req.input("degreeType", sql.NVarChar(100), data.degreeType);
      req.input("specialization", sql.NVarChar(200), data.specialization);
      req.input("startYear", sql.SmallInt, data.startYear);
      req.input("endYear", sql.SmallInt, data.endYear);
      req.input("isOngoing", sql.Bit, data.isOngoing ? 1 : 0);
      await req.query(`
        UPDATE dbo.Education SET
          InstitutionName = @institutionName,
          Degree = @degree,
          DegreeType = @degreeType,
          Specialization = @specialization,
          StartYear = @startYear,
          EndYear = @endYear,
          IsOngoing = @isOngoing,
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id AND ResumeId = @resumeId
      `);
    } else {
      const req = pool.request();
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("institutionName", sql.NVarChar(200), data.institutionName);
      req.input("degree", sql.NVarChar(200), data.degree);
      req.input("degreeType", sql.NVarChar(100), data.degreeType);
      req.input("specialization", sql.NVarChar(200), data.specialization);
      req.input("startYear", sql.SmallInt, data.startYear);
      req.input("endYear", sql.SmallInt, data.endYear);
      req.input("isOngoing", sql.Bit, data.isOngoing ? 1 : 0);
      await req.query(`
        INSERT INTO dbo.Education (
          Id, ResumeId, InstitutionName, Degree, DegreeType, Specialization,
          StartYear, EndYear, IsOngoing,
          SortOrder, CreatedAt, UpdatedAt
        )
        VALUES (
          NEWID(), @resumeId, @institutionName, @degree, @degreeType, @specialization,
          @startYear, @endYear, @isOngoing,
          (SELECT ISNULL(MAX(SortOrder), 0) + 1 FROM dbo.Education WHERE ResumeId = @resumeId),
          SYSUTCDATETIME(), SYSUTCDATETIME()
        )
      `);
    }
  });
}

export async function deleteEducation(
  id: string,
  resumeId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("id", sql.UniqueIdentifier, id);
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    await req.query(`
      DELETE FROM dbo.Education WHERE Id = @id AND ResumeId = @resumeId
    `);
  });
}

export async function reorderEducation(items: ReorderItem[]): Promise<void> {
  if (items.length === 0) return;
  return runWithPool(async (pool) => {
    const req = pool.request();
    let query = "";
    items.forEach((item, i) => {
      req.input(`id${i}`, sql.UniqueIdentifier, item.id);
      req.input(`so${i}`, sql.Int, item.sortOrder);
      query += `UPDATE dbo.Education SET SortOrder = @so${i} WHERE Id = @id${i}; `;
    });
    await req.query(query);
  });
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export async function getSkillsByResumeId(resumeId: string): Promise<Skill[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    const result = await req.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        SkillName, SortOrder, IsVisibleOnResume
      FROM dbo.Skills
      WHERE ResumeId = @resumeId
      ORDER BY SortOrder ASC
    `);
    return (result.recordset as Record<string, unknown>[]).map(mapSkill);
  });
}

export async function upsertSkill(
  resumeId: string,
  data: SkillInput,
): Promise<void> {
  return runWithPool(async (pool) => {
    if (data.id) {
      const req = pool.request();
      req.input("id", sql.UniqueIdentifier, data.id);
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("skillName", sql.NVarChar(200), data.skillName);
      await req.query(`
        UPDATE dbo.Skills SET
          SkillName = @skillName
        WHERE Id = @id AND ResumeId = @resumeId
      `);
    } else {
      const req = pool.request();
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("skillName", sql.NVarChar(200), data.skillName);
      await req.query(`
        INSERT INTO dbo.Skills (
          Id, ResumeId, SkillName, SortOrder
        )
        VALUES (
          NEWID(), @resumeId, @skillName,
          (SELECT ISNULL(MAX(SortOrder), 0) + 1 FROM dbo.Skills WHERE ResumeId = @resumeId)
        )
      `);
    }
  });
}

export async function deleteSkill(id: string, resumeId: string): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("id", sql.UniqueIdentifier, id);
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    await req.query(`
      DELETE FROM dbo.Skills WHERE Id = @id AND ResumeId = @resumeId
    `);
  });
}

export async function reorderSkills(items: ReorderItem[]): Promise<void> {
  if (items.length === 0) return;
  return runWithPool(async (pool) => {
    const req = pool.request();
    let query = "";
    items.forEach((item, i) => {
      req.input(`id${i}`, sql.UniqueIdentifier, item.id);
      req.input(`so${i}`, sql.Int, item.sortOrder);
      query += `UPDATE dbo.Skills SET SortOrder = @so${i} WHERE Id = @id${i}; `;
    });
    await req.query(query);
  });
}

// ─── Certifications ──────────────────────────────────────────────────────────

export async function getCertificationsByResumeId(
  resumeId: string,
): Promise<Certification[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    const result = await req.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        CertificationName, IssuingOrganization,
        IssueDate, ExpirationDate,
        CredentialId, SortOrder, IsVisibleOnResume
      FROM dbo.Certifications
      WHERE ResumeId = @resumeId
      ORDER BY SortOrder ASC
    `);
    return (result.recordset as Record<string, unknown>[]).map(mapCertification);
  });
}

export async function upsertCertification(
  resumeId: string,
  data: CertificationInput,
): Promise<void> {
  return runWithPool(async (pool) => {
    if (data.id) {
      const req = pool.request();
      req.input("id", sql.UniqueIdentifier, data.id);
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("certificationName", sql.NVarChar(200), data.certificationName);
      req.input("issuingOrganization", sql.NVarChar(200), data.issuingOrganization);
      req.input("issueDate", sql.Date, data.issueDate ? new Date(data.issueDate) : null);
      req.input("expirationDate", sql.Date, data.expirationDate ? new Date(data.expirationDate) : null);
      req.input("credentialId", sql.NVarChar(200), data.credentialId);
      await req.query(`
        UPDATE dbo.Certifications SET
          CertificationName = @certificationName,
          IssuingOrganization = @issuingOrganization,
          IssueDate = @issueDate,
          ExpirationDate = @expirationDate,
          CredentialId = @credentialId,
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id AND ResumeId = @resumeId
      `);
    } else {
      const req = pool.request();
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("certificationName", sql.NVarChar(200), data.certificationName);
      req.input("issuingOrganization", sql.NVarChar(200), data.issuingOrganization);
      req.input("issueDate", sql.Date, data.issueDate ? new Date(data.issueDate) : null);
      req.input("expirationDate", sql.Date, data.expirationDate ? new Date(data.expirationDate) : null);
      req.input("credentialId", sql.NVarChar(200), data.credentialId);
      await req.query(`
        INSERT INTO dbo.Certifications (
          Id, ResumeId, CertificationName, IssuingOrganization,
          IssueDate, ExpirationDate, CredentialId,
          SortOrder, CreatedAt, UpdatedAt
        )
        VALUES (
          NEWID(), @resumeId, @certificationName, @issuingOrganization,
          @issueDate, @expirationDate, @credentialId,
          (SELECT ISNULL(MAX(SortOrder), 0) + 1 FROM dbo.Certifications WHERE ResumeId = @resumeId),
          SYSUTCDATETIME(), SYSUTCDATETIME()
        )
      `);
    }
  });
}

export async function deleteCertification(
  id: string,
  resumeId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("id", sql.UniqueIdentifier, id);
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    await req.query(`
      DELETE FROM dbo.Certifications WHERE Id = @id AND ResumeId = @resumeId
    `);
  });
}

export async function reorderCertifications(
  items: ReorderItem[],
): Promise<void> {
  if (items.length === 0) return;
  return runWithPool(async (pool) => {
    const req = pool.request();
    let query = "";
    items.forEach((item, i) => {
      req.input(`id${i}`, sql.UniqueIdentifier, item.id);
      req.input(`so${i}`, sql.Int, item.sortOrder);
      query += `UPDATE dbo.Certifications SET SortOrder = @so${i} WHERE Id = @id${i}; `;
    });
    await req.query(query);
  });
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function getAchievementsByResumeId(
  resumeId: string,
): Promise<Achievement[]> {
  return runWithPool(async (pool) => {
    const achievementsTableName = await resolveAchievementsTableName(pool);
    if (!achievementsTableName) {
      return [];
    }
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    const result = await req.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        Year, Title, Organization, Description, SortOrder, IsVisibleOnResume
      FROM dbo.${achievementsTableName}
      WHERE ResumeId = @resumeId
      ORDER BY SortOrder ASC
    `);
    return (result.recordset as Record<string, unknown>[]).map(mapAchievement);
  });
}

export async function upsertAchievement(
  resumeId: string,
  data: AchievementInput,
): Promise<void> {
  return runWithPool(async (pool) => {
    const achievementsTableName = await resolveAchievementsTableName(pool);
    if (!achievementsTableName) {
      throw new Error(
        "La seccion de logros no esta configurada en la base de datos (falta tabla de Achievements).",
      );
    }
    if (data.id) {
      const req = pool.request();
      req.input("id", sql.UniqueIdentifier, data.id);
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("year", sql.SmallInt, data.year);
      req.input("title", sql.NVarChar(200), data.title);
      req.input("organization", sql.NVarChar(200), data.organization);
      req.input("description", sql.NVarChar(sql.MAX), data.description);
      await req.query(`
        UPDATE dbo.${achievementsTableName} SET
          Year = @year,
          Title = @title,
          Organization = @organization,
          Description = @description,
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id AND ResumeId = @resumeId
      `);
    } else {
      const req = pool.request();
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("year", sql.SmallInt, data.year);
      req.input("title", sql.NVarChar(200), data.title);
      req.input("organization", sql.NVarChar(200), data.organization);
      req.input("description", sql.NVarChar(sql.MAX), data.description);
      await req.query(`
        INSERT INTO dbo.${achievementsTableName} (
          Id, ResumeId, Year, Title, Organization, Description,
          SortOrder, CreatedAt, UpdatedAt
        )
        VALUES (
          NEWID(), @resumeId, @year, @title, @organization, @description,
          (SELECT ISNULL(MAX(SortOrder), 0) + 1 FROM dbo.${achievementsTableName} WHERE ResumeId = @resumeId),
          SYSUTCDATETIME(), SYSUTCDATETIME()
        )
      `);
    }
  });
}

export async function deleteAchievement(
  id: string,
  resumeId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const achievementsTableName = await resolveAchievementsTableName(pool);
    if (!achievementsTableName) {
      throw new Error(
        "La seccion de logros no esta configurada en la base de datos (falta tabla de Achievements).",
      );
    }
    const req = pool.request();
    req.input("id", sql.UniqueIdentifier, id);
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    await req.query(`
      DELETE FROM dbo.${achievementsTableName} WHERE Id = @id AND ResumeId = @resumeId
    `);
  });
}

export async function reorderAchievements(
  items: ReorderItem[],
): Promise<void> {
  if (items.length === 0) return;
  return runWithPool(async (pool) => {
    const achievementsTableName = await resolveAchievementsTableName(pool);
    if (!achievementsTableName) {
      throw new Error(
        "La seccion de logros no esta configurada en la base de datos (falta tabla de Achievements).",
      );
    }
    const req = pool.request();
    let query = "";
    items.forEach((item, i) => {
      req.input(`id${i}`, sql.UniqueIdentifier, item.id);
      req.input(`so${i}`, sql.Int, item.sortOrder);
      query += `UPDATE dbo.${achievementsTableName} SET SortOrder = @so${i} WHERE Id = @id${i}; `;
    });
    await req.query(query);
  });
}

// ─── Resume projects (relevant project experience) ────────────────────────────

export async function getProjectsByResumeId(
  resumeId: string,
): Promise<Project[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    const result = await req.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        ProjectName, Industry, Role, ProjectValue, Client, Year, ExpandedTitle, Description,
        SortOrder, IsVisibleOnResume
      FROM dbo.ResumeProjects
      WHERE ResumeId = @resumeId
      ORDER BY SortOrder ASC
    `);
    return (result.recordset as Record<string, unknown>[]).map(mapProject);
  });
}

export async function upsertProject(
  resumeId: string,
  data: ProjectInput,
): Promise<Project> {
  return runWithPool(async (pool) => {
    if (data.id) {
      const req = pool.request();
      req.input("id", sql.UniqueIdentifier, data.id);
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("projectName", sql.NVarChar(300), data.projectName);
      req.input("industry", sql.NVarChar(200), data.industry);
      req.input("role", sql.NVarChar(200), data.role);
      req.input("projectValue", sql.NVarChar(120), data.projectValue);
      req.input("client", sql.NVarChar(255), data.client);
      req.input("year", sql.SmallInt, data.year);
      req.input("expandedTitle", sql.NVarChar(500), data.expandedTitle);
      req.input("description", sql.NVarChar(sql.MAX), data.description);
      const result = await req.query(`
        UPDATE dbo.ResumeProjects SET
          ProjectName = @projectName,
          Industry = @industry,
          Role = @role,
          ProjectValue = @projectValue,
          Client = @client,
          Year = @year,
          ExpandedTitle = @expandedTitle,
          Description = @description,
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT 
          CAST(inserted.Id AS NVARCHAR(36)) AS Id,
          CAST(inserted.ResumeId AS NVARCHAR(36)) AS ResumeId,
          inserted.ProjectName, inserted.Industry, inserted.Role, 
          inserted.ProjectValue, inserted.Client, inserted.Year, inserted.ExpandedTitle,
          inserted.Description, inserted.SortOrder, inserted.IsVisibleOnResume
        WHERE Id = @id AND ResumeId = @resumeId
      `);
      return mapProject(result.recordset[0]);
    } else {
      const req = pool.request();
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("projectName", sql.NVarChar(300), data.projectName);
      req.input("industry", sql.NVarChar(200), data.industry);
      req.input("role", sql.NVarChar(200), data.role);
      req.input("projectValue", sql.NVarChar(120), data.projectValue);
      req.input("client", sql.NVarChar(255), data.client);
      req.input("year", sql.SmallInt, data.year);
      req.input("expandedTitle", sql.NVarChar(500), data.expandedTitle);
      req.input("description", sql.NVarChar(sql.MAX), data.description);
      const result = await req.query(`
        INSERT INTO dbo.ResumeProjects (
          Id, ResumeId, ProjectName, Industry, Role, ProjectValue, Client, Year, ExpandedTitle, Description,
          SortOrder, CreatedAt, UpdatedAt
        )
        OUTPUT 
          CAST(inserted.Id AS NVARCHAR(36)) AS Id,
          CAST(inserted.ResumeId AS NVARCHAR(36)) AS ResumeId,
          inserted.ProjectName, inserted.Industry, inserted.Role, 
          inserted.ProjectValue, inserted.Client, inserted.Year, inserted.ExpandedTitle,
          inserted.Description, inserted.SortOrder, inserted.IsVisibleOnResume
        VALUES (
          NEWID(), @resumeId, @projectName, @industry, @role, @projectValue, @client, @year, @expandedTitle, @description,
          (SELECT ISNULL(MAX(SortOrder), 0) + 1 FROM dbo.ResumeProjects WHERE ResumeId = @resumeId),
          SYSUTCDATETIME(), SYSUTCDATETIME()
        )
      `);
      return mapProject(result.recordset[0]);
    }
  });
}

export async function deleteProject(
  id: string,
  resumeId: string,
): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("id", sql.UniqueIdentifier, id);
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    await req.query(`
      DELETE FROM dbo.ResumeProjects WHERE Id = @id AND ResumeId = @resumeId
    `);
  });
}

export async function reorderProjects(
  items: ReorderItem[],
): Promise<void> {
  if (items.length === 0) return;
  return runWithPool(async (pool) => {
    const req = pool.request();
    let query = "";
    items.forEach((item, i) => {
      req.input(`id${i}`, sql.UniqueIdentifier, item.id);
      req.input(`so${i}`, sql.Int, item.sortOrder);
      query += `UPDATE dbo.ResumeProjects SET SortOrder = @so${i} WHERE Id = @id${i}; `;
    });
    await req.query(query);
  });
}

// ─── Licenses ────────────────────────────────────────────────────────────────

export async function getLicensesByResumeId(resumeId: string): Promise<License[]> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    const result = await req.query(`
      SELECT
        CAST(Id AS NVARCHAR(36)) AS Id,
        CAST(ResumeId AS NVARCHAR(36)) AS ResumeId,
        LicenseType, Jurisdiction, LicenseNumber,
        ExpirationDate, IsRetired, SortOrder, IsVisibleOnResume
      FROM dbo.Licenses
      WHERE ResumeId = @resumeId
      ORDER BY SortOrder ASC
    `);
    return (result.recordset as Record<string, unknown>[]).map(mapLicense);
  });
}

export async function upsertLicense(
  resumeId: string,
  data: LicenseInput,
): Promise<void> {
  return runWithPool(async (pool) => {
    if (data.id) {
      const req = pool.request();
      req.input("id", sql.UniqueIdentifier, data.id);
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("licenseType", sql.NVarChar(200), data.licenseType);
      req.input("jurisdiction", sql.NVarChar(100), data.jurisdiction);
      req.input("licenseNumber", sql.NVarChar(100), data.licenseNumber);
      req.input("expirationDate", sql.Date, data.expirationDate ? new Date(data.expirationDate) : null);
      req.input("isRetired", sql.Bit, data.isRetired ? 1 : 0);
      await req.query(`
        UPDATE dbo.Licenses SET
          LicenseType = @licenseType,
          Jurisdiction = @jurisdiction,
          LicenseNumber = @licenseNumber,
          ExpirationDate = @expirationDate,
          IsRetired = @isRetired,
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id AND ResumeId = @resumeId
      `);
    } else {
      const req = pool.request();
      req.input("resumeId", sql.UniqueIdentifier, resumeId);
      req.input("licenseType", sql.NVarChar(200), data.licenseType);
      req.input("jurisdiction", sql.NVarChar(100), data.jurisdiction);
      req.input("licenseNumber", sql.NVarChar(100), data.licenseNumber);
      req.input("expirationDate", sql.Date, data.expirationDate ? new Date(data.expirationDate) : null);
      req.input("isRetired", sql.Bit, data.isRetired ? 1 : 0);
      await req.query(`
        INSERT INTO dbo.Licenses (
          Id, ResumeId, LicenseType, Jurisdiction, LicenseNumber,
          ExpirationDate, IsRetired, SortOrder, CreatedAt, UpdatedAt
        )
        VALUES (
          NEWID(), @resumeId, @licenseType, @jurisdiction, @licenseNumber,
          @expirationDate, @isRetired,
          (SELECT ISNULL(MAX(SortOrder), 0) + 1 FROM dbo.Licenses WHERE ResumeId = @resumeId),
          SYSUTCDATETIME(), SYSUTCDATETIME()
        )
      `);
    }
  });
}

export async function deleteLicense(id: string, resumeId: string): Promise<void> {
  return runWithPool(async (pool) => {
    const req = pool.request();
    req.input("id", sql.UniqueIdentifier, id);
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    await req.query(`
      DELETE FROM dbo.Licenses WHERE Id = @id AND ResumeId = @resumeId
    `);
  });
}

export async function reorderLicenses(items: ReorderItem[]): Promise<void> {
  if (items.length === 0) return;
  return runWithPool(async (pool) => {
    const req = pool.request();
    let query = "";
    items.forEach((item, i) => {
      req.input(`id${i}`, sql.UniqueIdentifier, item.id);
      req.input(`so${i}`, sql.Int, item.sortOrder);
      query += `UPDATE dbo.Licenses SET SortOrder = @so${i} WHERE Id = @id${i}; `;
    });
    await req.query(query);
  });
}

// ─── Visibility toggle (shared) ──────────────────────────────────────────────

const VALID_SECTION_TABLES = [
  "WorkExperiences",
  "Education",
  "Skills",
  "Certifications",
  "ResumeProjects",
  "Licenses",
] as const;

type SectionTable = (typeof VALID_SECTION_TABLES)[number] | "Achievements";

export async function updateItemVisibility(
  table: SectionTable,
  itemId: string,
  resumeId: string,
  visible: boolean,
): Promise<void> {
  return runWithPool(async (pool) => {
    let tableName: string = table;
    if (table === "Achievements") {
      const resolved = await resolveAchievementsTableName(pool);
      if (!resolved) return;
      tableName = resolved;
    } else if (!VALID_SECTION_TABLES.includes(table as (typeof VALID_SECTION_TABLES)[number])) {
      throw new Error(`Invalid section table: ${table}`);
    }
    const req = pool.request();
    req.input("id", sql.UniqueIdentifier, itemId);
    req.input("resumeId", sql.UniqueIdentifier, resumeId);
    req.input("visible", sql.Bit, visible ? 1 : 0);
    await req.query(`
      UPDATE dbo.${tableName}
      SET IsVisibleOnResume = @visible
      WHERE Id = @id AND ResumeId = @resumeId
    `);
  });
}
