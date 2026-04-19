import { useState, useCallback, useMemo, useLayoutEffect } from "react";
import type { 
  ResumeProfile, 
  WorkExperience, 
  Education, 
  Skill, 
  Certification, 
  Achievement, 
  Project,
  License
} from "@/lib/db/types";
import type { PersonalDraft } from "@/components/resume/tabs/PersonalTab";

const PROFILE_STUB_TS = new Date(0);

function buildPreviewProfile(
  profile: ResumeProfile | null,
  draft: PersonalDraft,
  resumeId: string,
): ResumeProfile {
  const base: ResumeProfile = profile ?? {
    id: "",
    resumeId,
    jobTitle: null,
    professionalSummary: null,
    homeAddress: null,
    personalPhone: null,
    personalEmail: null,
    createdAt: PROFILE_STUB_TS,
    updatedAt: PROFILE_STUB_TS,
  };
  return {
    ...base,
    jobTitle: draft.jobTitle.trim() || null,
    professionalSummary: draft.professionalSummary.trim() || null,
    homeAddress: draft.homeAddress.trim() || null,
    personalPhone: draft.personalPhone.trim() || null,
    personalEmail: draft.personalEmail.trim() || null,
  };
}

export function usePreviewState({
  resumeId,
  employeeName,
  profile,
  experiences,
  education,
  skills,
  certifications,
  achievements,
  projects,
  licenses,
}: {
  resumeId: string;
  employeeName: string;
  profile: ResumeProfile | null;
  experiences: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  achievements: Achievement[];
  projects: Project[];
  licenses: License[];
}) {
  const [profileDraft, setProfileDraft] = useState<PersonalDraft>({
    jobTitle:            profile?.jobTitle ?? "",
    professionalSummary: profile?.professionalSummary ?? "",
    homeAddress:         profile?.homeAddress ?? "",
    personalPhone:       profile?.personalPhone ?? "",
    personalEmail:       profile?.personalEmail ?? "",
  });

  const [draftExperiences, setDraftExperiences] = useState(() => experiences);
  const [draftEducation, setDraftEducation] = useState(() => education);
  const [draftSkills, setDraftSkills] = useState(() => skills);
  const [draftAchievements, setDraftAchievements] = useState(() => achievements);
  const [draftProjects, setDraftProjects] = useState(() => projects);
  const [draftLicenses, setDraftLicenses] = useState(() => licenses);
  const [draftCertifications, setDraftCertifications] = useState(() => certifications);

  // OPT-01: Smarter update logic — only clone if the incoming data reference has changed
  useLayoutEffect(() => {
    setDraftExperiences(experiences);
    setDraftEducation(education);
    setDraftSkills(skills);
    setDraftAchievements(achievements);
    setDraftProjects(projects);
    setDraftLicenses(licenses);
    setDraftCertifications(certifications);
  }, [experiences, education, skills, achievements, projects, licenses, certifications]);

  const previewProfile = useMemo(
    () => buildPreviewProfile(profile, profileDraft, resumeId),
    [profile, profileDraft, resumeId],
  );

  const previewProps = useMemo(
    () => ({
      employeeName,
      profile: previewProfile,
      experiences: draftExperiences,
      education: draftEducation,
      skills: draftSkills,
      certifications: draftCertifications,
      projects: draftProjects,
      licenses: draftLicenses,
      achievements: draftAchievements,
    }),
    [
      employeeName,
      previewProfile,
      draftExperiences,
      draftEducation,
      draftSkills,
      draftCertifications,
      draftProjects,
      draftLicenses,
      draftAchievements,
    ],
  );
  const resetDrafts = useCallback(() => {
    setProfileDraft({
      jobTitle: profile?.jobTitle ?? "",
      professionalSummary: profile?.professionalSummary ?? "",
      homeAddress: profile?.homeAddress ?? "",
      personalPhone: profile?.personalPhone ?? "",
      personalEmail: profile?.personalEmail ?? "",
    });
    setDraftExperiences(experiences);
    setDraftEducation(education);
    setDraftSkills(skills);
    setDraftAchievements(achievements);
    setDraftProjects(projects);
    setDraftLicenses(licenses);
    setDraftCertifications(certifications);
  }, [profile, experiences, education, skills, achievements, projects, licenses, certifications]);

  return {
    profileDraft,
    setProfileDraft,
    draftExperiences,
    setDraftExperiences,
    draftEducation,
    setDraftEducation,
    draftSkills,
    setDraftSkills,
    draftAchievements,
    setDraftAchievements,
    draftProjects,
    setDraftProjects,
    draftLicenses,
    setDraftLicenses,
    draftCertifications,
    setDraftCertifications,
    previewProps,
    resetDrafts,
  };
}
