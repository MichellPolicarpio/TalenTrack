-- Relevant project experience rows per resume (Projects tab in the builder).
-- Run once against the same database as the app.

IF OBJECT_ID(N'dbo.ResumeProjects', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ResumeProjects (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    ResumeId UNIQUEIDENTIFIER NOT NULL,
    ProjectName NVARCHAR(300) NOT NULL,
    ClientName NVARCHAR(200) NULL,
    RoleTitle NVARCHAR(200) NULL,
    ProjectValue NVARCHAR(120) NULL,
    Description NVARCHAR(MAX) NULL,
    SortOrder INT NOT NULL CONSTRAINT DF_ResumeProjects_SortOrder DEFAULT (0),
    IsVisibleOnResume BIT NOT NULL CONSTRAINT DF_ResumeProjects_IsVisible DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ResumeProjects_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_ResumeProjects_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_ResumeProjects_Resume
      FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes (Id) ON DELETE CASCADE
  );

  CREATE INDEX IX_ResumeProjects_ResumeId_SortOrder
    ON dbo.ResumeProjects (ResumeId, SortOrder);
END
GO
