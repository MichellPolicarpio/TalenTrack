---
name: ResumeBuilder Project Overview
description: Architecture, stack, roles, and data flow of the ResumeBuilder Next.js app
type: project
---

Internal HR tool built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4.

**Stack:**
- Framework: Next.js 16.2.3 — breaking-change version; APIs differ from training data. Always read `node_modules/next/dist/docs/` before writing Next.js-specific code.
- Auth: next-auth v5 beta via Microsoft Entra ID (Azure AD) OAuth. Roles come from Azure AD token claims.
- DB: Azure SQL Server via `mssql` + `tedious`. Always Encrypted with Azure Key Vault. Connection pool in `lib/db.ts` (`runWithPool` helper).
- UI: shadcn/ui components in `components/ui/`, DnD Kit for drag-and-drop, Framer Motion, Sonner toasts.
- PDF export: html2canvas-pro + jspdf.

**Roles (types/user-role.ts):** `Employee` | `HR_Revisor` | `Admin`
- Middleware (`middleware.ts`) guards `/dashboard/hr` (HR_Revisor | Admin) and `/dashboard/admin` (Admin only).

**Directory layout:**
- `app/(dashboard)/` — main dashboard routes
- `app/api/auth/` — NextAuth route handler
- `components/resume/` — resume editor, preview, onboarding wizard, section components (achievements, certifications, education, skills, work experience)
- `components/hr/` — HR review panel
- `components/layout/` — AppSidebar, PageHeader, ResumeTopBar
- `lib/actions/` — server actions: approval, onboarding, sections
- `lib/repositories/` — data access: approval, employee, resume, sections
- `lib/auth.ts` — NextAuth config (Azure AD provider, JWT/session callbacks)
- `lib/db.ts` — SQL connection pool, `runWithPool`
- `sql/` — migration scripts

**Why:** Internal tool to let employees build and HR to review/approve resumes. Runs on Azure infrastructure (Entra ID SSO, Azure SQL).

**How to apply:** When suggesting code changes, respect the role-based access model and always use `runWithPool` for DB access. Never bypass auth middleware. Check Next.js 16 docs before using Next.js APIs.
