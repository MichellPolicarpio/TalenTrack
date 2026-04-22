import type { UserRole } from "@/types/user-role";

export type Employee = {
  id: string;
  entraObjectId: string;
  displayName: string;
  corporateEmail: string;
  appRole: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
};

export type Resume = {
  id: string;
  employeeId: string;
  status: ResumeStatus;
  reminderMonths: number;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewerNotes: string | null;
  lastApprovedAt: Date | null;
  publicShareToken: string | null;
  isPublicLinkActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeProfile = {
  id: string;
  resumeId: string;
  professionalSummary: string | null;
  jobTitle: string | null;
  homeAddress: string | null;
  personalPhone: string | null;
  personalEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeWithProfile = {
  resume: Resume;
  profile: ResumeProfile | null;
};

export type UpsertEmployeeInput = {
  entraObjectId: string;
  displayName: string;
  corporateEmail: string;
  appRole: UserRole;
};

export type UpdateProfileInput = {
  jobTitle: string;
  professionalSummary: string;
  homeAddress: string | null;
  personalPhone: string | null;
  personalEmail: string | null;
};

export type ReminderMonthsOption = 3 | 6 | 9 | 12;

export type ProfileFormValues = {
  jobTitle: string;
  professionalSummary: string;
  reminderMonths: ReminderMonthsOption;
  personalEmail: string;
  personalPhone: string;
  homeAddress: string;
};

// ─── Section types ───────────────────────────────────────────────────────────

export type WorkExperience = {
  id: string;
  resumeId: string;
  companyName: string;
  jobTitle: string;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isCurrent: boolean;
  description: string | null;
  sortOrder: number;
  isVisibleOnResume: boolean;
};

export type Education = {
  id: string;
  resumeId: string;
  institutionName: string;
  degree: string;
  degreeType: string | null;
  specialization: string | null;
  startYear: number | null;
  endYear: number | null;
  isOngoing: boolean;
  sortOrder: number;
  isVisibleOnResume: boolean;
};

export type ProficiencyLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export type Skill = {
  id: string;
  resumeId: string;
  skillName: string;
  proficiencyLevel: ProficiencyLevel;
  sortOrder: number;
  isVisibleOnResume: boolean;
};

export type Certification = {
  id: string;
  resumeId: string;
  certificationName: string;
  issuingOrganization: string | null;
  issueDate: Date | null;
  expirationDate: Date | null;
  credentialId: string | null;

  sortOrder: number;
  isVisibleOnResume: boolean;
};

export type Achievement = {
  id: string;
  resumeId: string;
  year: number | null;
  title: string;
  organization: string | null;
  description: string | null;
  sortOrder: number;
  isVisibleOnResume: boolean;
};

/** Relevant project experience (Projects tab → resume / PDF right column). */
/** Relevant project experience (Projects tab → resume / PDF right column). */
export type Project = {
  id: string;
  resumeId: string;
  projectName: string;
  industry: string | null;
  role: string | null;
  projectValue: string | null;
  client: string | null;
  year: number | null;
  expandedTitle: string | null;
  description: string | null;
  sortOrder: number;
  isVisibleOnResume: boolean;
};

export type License = {
  id: string;
  resumeId: string;
  licenseType: string;
  jurisdiction: string;
  licenseNumber: string | null;
  expirationDate: Date | null;
  isRetired: boolean;
  sortOrder: number;
  isVisibleOnResume: boolean;
  status: LicenseStatus; // Calculado en el repo
};

export type LicenseStatus = "Active" | "Inactive" | "Retired";


// ─── Input types ─────────────────────────────────────────────────────────────

export type WorkExperienceInput = {
  id?: string;
  companyName: string;
  jobTitle: string;
  location: string | null;
  startDate: string | null; // ISO string desde el form
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
};

export type EducationInput = {
  id?: string;
  institutionName: string;
  degree: string;
  degreeType: string | null;
  specialization: string | null;
  startYear: number | null;
  endYear: number | null;
  isOngoing: boolean;
};

export type SkillInput = {
  id?: string;
  skillName: string;
};

export type CertificationInput = {
  id?: string;
  certificationName: string;
  issuingOrganization: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  credentialId: string | null;

};

export type AchievementInput = {
  id?: string;
  year: number | null;
  title: string;
  organization: string | null;
  description: string | null;
};

export type ProjectInput = {
  id?: string;
  projectName: string;
  industry: string | null;
  role: string | null;
  projectValue: string | null;
  client: string | null;
  year: number | null;
  expandedTitle: string | null;
  description: string | null;
};

export type LicenseInput = {
  id?: string;
  licenseType: string;
  jurisdiction: string;
  licenseNumber: string | null;
  expirationDate: string | null; // ISO string
  isRetired: boolean;
};

export type ReorderItem = {
  id: string;
  sortOrder: number;
};

// ─── Approval types ───────────────────────────────────────────────────────────

export type ResumeStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "NEEDS_CHANGES";

export type ResumeWithStatus = Resume & {
  status: ResumeStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewerNotes: string | null;
  lastApprovedAt: Date | null;
  publicShareToken: string | null;
  isPublicLinkActive: boolean;
  version: number;
};

export type AuditLogEntry = {
  id: string;
  resumeId: string;
  actorId: string;
  actorName: string;
  fromStatus: ResumeStatus;
  toStatus: ResumeStatus;
  notes: string | null;
  createdAt: Date;
};

export type ResumeQueueItem = {
  resumeId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  jobTitle: string | null;
  submittedAt: Date;
  version: number;
};

/** In-app notification (see dbo.Notifications). */
export type AppNotificationType = "NEEDS_CHANGES" | "APPROVED";

export type AppNotification = {
  id: string;
  employeeId: string;
  resumeId: string | null;
  type: AppNotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

// ─── PDF export aggregate ────────────────────────────────────────────────────

export type FullResumeData = {
  employee: { displayName: string; corporateEmail: string };
  profile: ResumeProfile | null;
  workExperiences: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  projects: Project[];
  achievements: Achievement[];
  licenses: License[];
};
export type ResumeSnapshot = {
  id: string;
  resumeId: string;
  version: number;
  snapshotData: FullResumeData;
  createdAt: Date;
};

export type ResumeSnapshotMeta = {
  id: string;
  resumeId: string;
  version: number;
  createdAt: Date;
  jobTitle: string | null;
  professionalSummary: string | null;
  counts: {
    experiences: number;
    education: number;
    skills: number;
  };
};

export type GlobalSetting = {
  key: string;
  value: string;
  updatedAt: Date;
  updatedBy: string | null;
};
