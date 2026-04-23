-- =============================================================================
-- SCRIPT: initialize-talentrack-db.sql
-- DESCRIPTION: Full schema initialization for the TalenTrack project.
-- =============================================================================

SET NOCOUNT ON;
GO

-- 1. EMPLOYEES
IF OBJECT_ID(N'dbo.Employees', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Employees (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        EntraObjectId NVARCHAR(128) NOT NULL UNIQUE,
        DisplayName NVARCHAR(200) NOT NULL,
        CorporateEmail NVARCHAR(320) NOT NULL UNIQUE,
        AppRole NVARCHAR(50) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        IsActive BIT NOT NULL DEFAULT 1
    );
    CREATE INDEX IX_Employees_EntraObjectId ON dbo.Employees(EntraObjectId);
    CREATE INDEX IX_Employees_Email ON dbo.Employees(CorporateEmail);
    PRINT 'Table dbo.Employees created.';
END
GO

-- 2. RESUMES
IF OBJECT_ID(N'dbo.Resumes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Resumes (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        EmployeeId UNIQUEIDENTIFIER NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'DRAFT',
        ReminderMonths TINYINT NOT NULL DEFAULT 6,
        SubmittedAt DATETIMEOFFSET NULL,
        ReviewedAt DATETIMEOFFSET NULL,
        ReviewedBy UNIQUEIDENTIFIER NULL,
        ReviewerNotes NVARCHAR(MAX) NULL,
        LastApprovedAt DATETIMEOFFSET NULL,
        PublicShareToken UNIQUEIDENTIFIER NULL,
        IsPublicLinkActive BIT NOT NULL DEFAULT 0,
        Version INT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Resumes_Employee FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(Id)
    );
    CREATE INDEX IX_Resumes_EmployeeId ON dbo.Resumes(EmployeeId);
    CREATE INDEX IX_Resumes_Status ON dbo.Resumes(Status);
    PRINT 'Table dbo.Resumes created.';
END
GO

-- 3. RESUME PROFILES
IF OBJECT_ID(N'dbo.ResumeProfiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ResumeProfiles (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL UNIQUE,
        JobTitle NVARCHAR(200) NULL,
        ProfessionalSummary NVARCHAR(MAX) NULL, -- Encrypted in app
        HomeAddress NVARCHAR(MAX) NULL,        -- Encrypted in app
        PersonalPhone NVARCHAR(MAX) NULL,      -- Encrypted in app
        PersonalEmail NVARCHAR(MAX) NULL,      -- Encrypted in app
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Profiles_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE
    );
    PRINT 'Table dbo.ResumeProfiles created.';
END
GO

-- 4. WORK EXPERIENCES
IF OBJECT_ID(N'dbo.WorkExperiences', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WorkExperiences (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL,
        CompanyName NVARCHAR(200) NOT NULL,
        JobTitle NVARCHAR(200) NOT NULL,
        Location NVARCHAR(200) NULL,
        StartDate DATE NULL,
        EndDate DATE NULL,
        IsCurrent BIT NOT NULL DEFAULT 0,
        Description NVARCHAR(MAX) NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        IsVisibleOnResume BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_WorkExp_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_WorkExp_ResumeId ON dbo.WorkExperiences(ResumeId, SortOrder);
    PRINT 'Table dbo.WorkExperiences created.';
END
GO

-- 5. EDUCATION
IF OBJECT_ID(N'dbo.Education', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Education (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL,
        InstitutionName NVARCHAR(200) NOT NULL,
        Degree NVARCHAR(200) NOT NULL,
        DegreeType NVARCHAR(100) NULL,
        Specialization NVARCHAR(200) NULL,
        StartYear SMALLINT NULL,
        EndYear SMALLINT NULL,
        IsOngoing BIT NOT NULL DEFAULT 0,
        SortOrder INT NOT NULL DEFAULT 0,
        IsVisibleOnResume BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Education_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Education_ResumeId ON dbo.Education(ResumeId, SortOrder);
    PRINT 'Table dbo.Education created.';
END
GO

-- 6. SKILLS
IF OBJECT_ID(N'dbo.Skills', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Skills (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL,
        SkillName NVARCHAR(200) NOT NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        IsVisibleOnResume BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_Skills_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Skills_ResumeId ON dbo.Skills(ResumeId, SortOrder);
    PRINT 'Table dbo.Skills created.';
END
GO

-- 7. CERTIFICATIONS
IF OBJECT_ID(N'dbo.Certifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Certifications (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL,
        CertificationName NVARCHAR(200) NOT NULL,
        IssuingOrganization NVARCHAR(200) NULL,
        IssueDate DATE NULL,
        ExpirationDate DATE NULL,
        CredentialId NVARCHAR(200) NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        IsVisibleOnResume BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Cert_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Cert_ResumeId ON dbo.Certifications(ResumeId, SortOrder);
    PRINT 'Table dbo.Certifications created.';
END
GO

-- 8. RESUME PROJECTS
IF OBJECT_ID(N'dbo.ResumeProjects', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ResumeProjects (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL,
        ProjectName NVARCHAR(300) NOT NULL,
        Industry NVARCHAR(200) NULL,
        Role NVARCHAR(200) NULL,
        ProjectValue NVARCHAR(120) NULL,
        Client NVARCHAR(255) NULL,
        Year SMALLINT NULL,
        ExpandedTitle NVARCHAR(500) NULL,
        Description NVARCHAR(MAX) NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        IsVisibleOnResume BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Projects_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Projects_ResumeId ON dbo.ResumeProjects(ResumeId, SortOrder);
    PRINT 'Table dbo.ResumeProjects created.';
END
GO

-- 9. LICENSES
IF OBJECT_ID(N'dbo.Licenses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Licenses (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL,
        LicenseType NVARCHAR(200) NOT NULL,
        Jurisdiction NVARCHAR(100) NOT NULL,
        LicenseNumber NVARCHAR(100) NULL,
        ExpirationDate DATE NULL,
        IsRetired BIT NOT NULL DEFAULT 0,
        SortOrder INT NOT NULL DEFAULT 0,
        IsVisibleOnResume BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Licenses_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Licenses_ResumeId ON dbo.Licenses(ResumeId, SortOrder);
    PRINT 'Table dbo.Licenses created.';
END
GO

-- 10. ACHIEVEMENTS
IF OBJECT_ID(N'dbo.Achievements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Achievements (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Year SMALLINT NULL,
        Organization NVARCHAR(200) NULL,
        Description NVARCHAR(MAX) NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        IsVisibleOnResume BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Achievements_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Achievements_ResumeId ON dbo.Achievements(ResumeId, SortOrder);
    PRINT 'Table dbo.Achievements created.';
END
GO

-- 11. RESUME SNAPSHOTS
IF OBJECT_ID(N'dbo.ResumeSnapshots', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ResumeSnapshots (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL,
        Version INT NOT NULL,
        SnapshotData NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT FK_Snapshots_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Snapshots_ResumeId ON dbo.ResumeSnapshots(ResumeId);
    PRINT 'Table dbo.ResumeSnapshots created.';
END
GO

-- 12. NOTIFICATIONS
IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        EmployeeId UNIQUEIDENTIFIER NOT NULL,
        ResumeId UNIQUEIDENTIFIER NULL,
        Type NVARCHAR(50) NOT NULL,
        Message NVARCHAR(500) NOT NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT FK_Notifications_Employee FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Notifications_Employee ON dbo.Notifications(EmployeeId, IsRead);
    PRINT 'Table dbo.Notifications created.';
END
GO

-- 13. APPROVAL AUDIT LOG
IF OBJECT_ID(N'dbo.ApprovalAuditLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ApprovalAuditLog (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        ResumeId UNIQUEIDENTIFIER NOT NULL,
        ActorId UNIQUEIDENTIFIER NOT NULL,
        FromStatus NVARCHAR(50) NULL,
        ToStatus NVARCHAR(50) NOT NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT FK_Audit_Resume FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes(Id) ON DELETE CASCADE,
        CONSTRAINT FK_Audit_Actor FOREIGN KEY (ActorId) REFERENCES dbo.Employees(Id)
    );
    CREATE INDEX IX_Audit_ResumeId ON dbo.ApprovalAuditLog(ResumeId);
    PRINT 'Table dbo.ApprovalAuditLog created.';
END
GO

PRINT 'Database initialization completed successfully.';
