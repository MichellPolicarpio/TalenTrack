-- In-app notifications for employees (e.g. HR requested changes, resume approved).
-- Run once against the same database as the app.

IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Notifications (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    EmployeeId UNIQUEIDENTIFIER NOT NULL,
    ResumeId UNIQUEIDENTIFIER NULL,
    Type NVARCHAR(50) NOT NULL,
    Message NVARCHAR(500) NOT NULL,
    IsRead BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT (0),
    CreatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT (SYSDATETIMEOFFSET()),
    CONSTRAINT FK_Notifications_Employee
      FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id)
  );

  CREATE INDEX IX_Notifications_Employee_IsRead
    ON dbo.Notifications (EmployeeId, IsRead);

  CREATE INDEX IX_Notifications_Employee_CreatedAt
    ON dbo.Notifications (EmployeeId, CreatedAt DESC);
END
GO
