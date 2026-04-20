-- Create the Achievements table if it doesn't exist.
-- Run this on your Azure/MSSQL database.

IF OBJECT_ID(N'dbo.Achievements', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Achievements (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    ResumeId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Year SMALLINT NULL,
    Organization NVARCHAR(200) NULL,
    Description NVARCHAR(MAX) NULL,
    SortOrder INT NOT NULL CONSTRAINT DF_Achievements_SortOrder DEFAULT (0),
    IsVisibleOnResume BIT NOT NULL CONSTRAINT DF_Achievements_IsVisible DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Achievements_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Achievements_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Achievements_Resume
      FOREIGN KEY (ResumeId) REFERENCES dbo.Resumes (Id) ON DELETE CASCADE
  );

  CREATE INDEX IX_Achievements_ResumeId_SortOrder
    ON dbo.Achievements (ResumeId, SortOrder);
    
  PRINT 'Table dbo.Achievements created successfully.';
END
ELSE
BEGIN
  PRINT 'Table dbo.Achievements already exists.';
END
GO
