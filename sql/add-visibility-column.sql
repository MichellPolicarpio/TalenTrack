-- Phase 5: Add IsVisibleOnResume column to all section tables
-- Run this script in Azure SQL before using the preview/PDF features.
-- Existing rows default to 1 (visible).

ALTER TABLE dbo.WorkExperiences ADD IsVisibleOnResume BIT NOT NULL CONSTRAINT DF_WE_Visible DEFAULT 1;
ALTER TABLE dbo.Education ADD IsVisibleOnResume BIT NOT NULL CONSTRAINT DF_Ed_Visible DEFAULT 1;
ALTER TABLE dbo.Skills ADD IsVisibleOnResume BIT NOT NULL CONSTRAINT DF_Sk_Visible DEFAULT 1;
ALTER TABLE dbo.Certifications ADD IsVisibleOnResume BIT NOT NULL CONSTRAINT DF_Cert_Visible DEFAULT 1;
-- Si la tabla de Achievements existe en tu esquema, descomenta la linea correspondiente:
-- ALTER TABLE dbo.Achievements ADD IsVisibleOnResume BIT NOT NULL CONSTRAINT DF_Ach_Visible DEFAULT 1;
