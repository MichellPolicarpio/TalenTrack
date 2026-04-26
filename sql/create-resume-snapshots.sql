-- SCRIPT: create-resume-snapshots.sql
-- Description: Creates a table to store point-in-time snapshots of approved resumes.
-- Use this to preserve history when a resume is updated after approval.

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ResumeSnapshots]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ResumeSnapshots] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [ResumeId] UNIQUEIDENTIFIER NOT NULL,
        [Version] INT NOT NULL,
        [SnapshotData] NVARCHAR(MAX) NOT NULL, -- JSON data of the full resume
        [CreatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        
        CONSTRAINT [FK_ResumeSnapshots_Resumes] FOREIGN KEY ([ResumeId]) REFERENCES [dbo].[Resumes] ([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_ResumeSnapshots_ResumeId] ON [dbo].[ResumeSnapshots] ([ResumeId]);
END
GO
