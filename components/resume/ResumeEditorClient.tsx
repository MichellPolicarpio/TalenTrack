"use client";

import { useRef, useState, useCallback, useMemo, useLayoutEffect, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FolderKanban,
  GraduationCap,
  Loader2,
  Printer,
  RotateCcw,
  Send,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorActionBar } from "@/components/resume/EditorActionBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { StatusBanner } from "@/components/resume/StatusBanner";
import {
  ResumePreview,
  type ResumePreviewProps,
} from "@/components/resume/ResumePreview";
import { PendingReviewView } from "@/components/resume/PendingReviewView";
import { ApprovedView } from "@/components/resume/ApprovedView";
import { PersonalTab, type PersonalDraft } from "@/components/resume/tabs/PersonalTab";
import { ExperienceTab } from "@/components/resume/tabs/ExperienceTab";
import { EducationTab } from "@/components/resume/tabs/EducationTab";
import { ProjectsTab } from "@/components/resume/tabs/ProjectsTab";
import { SkillsTab } from "@/components/resume/tabs/SkillsTab";
import { CertificationsTab } from "@/components/resume/tabs/CertificationsTab";
import { AchievementsTab } from "@/components/resume/tabs/AchievementsTab";
import { LicensesTab } from "@/components/resume/tabs/LicensesTab";
import { saveProfileAction } from "@/lib/actions/profile.actions";
import { submitForApprovalAction } from "@/lib/actions/approval.actions";
import { coerceDate, latestOf } from "@/lib/format-last-saved";
import { useDashboard } from "@/lib/context/dashboard-context";
import type {
  ResumeStatus,
  ResumeProfile,
  WorkExperience,
  Education,
  Skill,
  Certification,
  Achievement,
  Project,
  License,
} from "@/lib/db/types";
import type { UserRole } from "@/types/user-role";
import { usePreviewState } from "@/lib/hooks/usePreviewState";
import { useResumeEditor } from "@/lib/hooks/useResumeEditor";
import { useTabScroll } from "@/lib/hooks/useTabScroll";
import { useEditorChromeHeight } from "@/lib/hooks/useEditorChromeHeight";

const PROFILE_STUB_TS = new Date(0);

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResumeEditorClientProps = {
  resumeId: string;
  status: ResumeStatus;
  reviewerNotes: string | null;
  publicShareToken: string | null;
  employeeName: string;
  userEmail: string;
  role: UserRole;
  profile: ResumeProfile | null;
  /** Resume row `UpdatedAt` from the server (for “last saved” display). */
  resumeUpdatedAt: Date | string | null;
  experiences: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  achievements: Achievement[];
  projects: Project[];
  licenses: License[];
};

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: readonly {
  value: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "personal", label: "Personal Info", icon: User },
  { value: "experience", label: "Experience", icon: Briefcase },
  { value: "licenses", label: "Licenses", icon: Award },
  { value: "certifications", label: "Certifications", icon: BadgeCheck },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "skills", label: "Skills", icon: Sparkles },
  { value: "achievements", label: "Achievements", icon: Trophy },
  { value: "projects", label: "Projects", icon: FolderKanban },
] as const;

// ─── Zoom constants ───────────────────────────────────────────────────────────

const ZOOM_MIN = 40;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;
const ZOOM_DEFAULT = 60;
/** Default zoom on very wide viewports (Tailwind `2xl`). */
const ZOOM_DEFAULT_LARGE = 80;
const LARGE_PREVIEW_MIN_WIDTH_PX = 1536;

// ─── Component ────────────────────────────────────────────────────────────────

export function ResumeEditorClient({
  resumeId,
  status,
  reviewerNotes,
  publicShareToken,
  employeeName,
  userEmail,
  role,
  profile,
  resumeUpdatedAt,
  experiences,
  education,
  skills,
  certifications,
  achievements,
  projects,
  licenses,
}: ResumeEditorClientProps) {
  // ── Preview state ──
  const previewRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [mobileZoom, setMobileZoom] = useState(45);
  const [downloading, setDownloading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const router = useRouter();
  const { setActiveResumeStatus, triggerEditHint } = useDashboard();

  useEffect(() => {
    setActiveResumeStatus(status);
    return () => setActiveResumeStatus(null);
  }, [status, setActiveResumeStatus]);

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LARGE_PREVIEW_MIN_WIDTH_PX}px)`);
    if (mq.matches) {
      setZoom(ZOOM_DEFAULT_LARGE);
    }
  }, []);

  const resetPreviewZoom = useCallback(() => {
    const mq = window.matchMedia(`(min-width: ${LARGE_PREVIEW_MIN_WIDTH_PX}px)`);
    setZoom(mq.matches ? ZOOM_DEFAULT_LARGE : ZOOM_DEFAULT);
  }, []);

  const serverSavedAt = useMemo(
    () => latestOf(coerceDate(resumeUpdatedAt), coerceDate(profile?.updatedAt)),
    [resumeUpdatedAt, profile?.updatedAt],
  );

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(serverSavedAt);
  const bumpLastSaved = useCallback(() => setLastSavedAt(new Date()), []);

  useLayoutEffect(() => {
    setLastSavedAt((prev) => {
      if (!serverSavedAt) return prev;
      if (!prev || serverSavedAt.getTime() >= prev.getTime()) return serverSavedAt;
      return prev;
    });
  }, [serverSavedAt]);

  const onSectionPersisted = useCallback(() => {
    bumpLastSaved();
    router.refresh();
  }, [bumpLastSaved, router]);

  const [isAddingCert, setIsAddingCert] = useState(false);
  const [isAddingLicense, setIsAddingLicense] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [newCertDraft, setNewCertDraft] = useState<any>(null);
  const [newLicenseDraft, setNewLicenseDraft] = useState<any>(null);
  const [newProjectDraft, setNewProjectDraft] = useState<any>(null);
  const [newSkillDraft, setNewSkillDraft] = useState<any>(null);
  const [newExperienceDraft, setNewExperienceDraft] = useState<any>(null);
  const [newEducationDraft, setNewEducationDraft] = useState<any>(null);
  const [newAchievementDraft, setNewAchievementDraft] = useState<any>(null);
  
  // Logic to close all adding forms - defined BEFORE useResumeEditor to avoid TDZ
  const resetAddingStates = useCallback(() => {
    setIsAddingCert(false);
    setIsAddingLicense(false);
    setIsAddingProject(false);
    setIsAddingSkill(false);
    setIsAddingExperience(false);
    setIsAddingEducation(false);
    setIsAddingAchievement(false);
    setNewExperienceDraft(null);
    setNewEducationDraft(null);
    setNewAchievementDraft(null);
    setNewCertDraft(null);
    setNewLicenseDraft(null);
    setNewProjectDraft(null);
    setNewSkillDraft(null);
  }, []);

  const {
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
  } = usePreviewState({
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
  });

  const {
    isLocked,
    setIsLocked,
    activeTab,
    setActiveTab,
    isSaving,
    isSubmitting,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleSubmitFinal,
    isPendingReview,
  } = useResumeEditor({
    resumeId,
    status,
    profileDraft,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    resetDrafts,
    bumpLastSaved,
    onCancel: resetAddingStates,
  });

  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  const { tabStripScrollRef, tabStripScroll, scrollTabStrip } = useTabScroll(activeTab);
  const { editorChromeRef, editorChromeHeight } = useEditorChromeHeight();

  const handleProfileChange = useCallback(
    (field: keyof PersonalDraft, value: string) => {
      let finalValue = value;

      if (field === "jobTitle") {
        // Title Case: Capitalize first letter of each word, rest lowercase.
        finalValue = value
          .split(/(\s+)/)
          .map((word) =>
            word.trim().length > 0
              ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              : word
          )
          .join("");
      } else if (field === "personalPhone") {
        // Numbers only: Strip everything that is not a digit.
        finalValue = value.replace(/\D/g, "");
      }

      setProfileDraft((prev) => ({ ...prev, [field]: finalValue }));
      setHasUnsavedChanges(true);
    },
    [setProfileDraft, setHasUnsavedChanges],
  );

  const headerActions = useMemo(
    () =>
      !isLocked ||
      hasUnsavedChanges ||
      status === "DRAFT" ||
      status === "NEEDS_CHANGES" ? (
        <EditorActionBar
          isLocked={isLocked}
          hasUnsavedChanges={hasUnsavedChanges}
          canEdit={!isLocked || status === "DRAFT" || status === "NEEDS_CHANGES"}
          isSaving={isSaving}
          isSubmitting={isSubmitting}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          onSubmit={() => setIsSubmitConfirmOpen(true)}
        />
      ) : null,
    [
      isLocked,
      hasUnsavedChanges,
      status,
      isSaving,
      isSubmitting,
      handleEdit,
      handleSave,
      handleCancelEdit,
      handleSubmitFinal,
    ],
  );

  // ── WYSIWYG PDF: capture the on-screen ResumePreview (Brindley layout) ──
  const handleExportPdf = useCallback(async (mode: "download" | "print") => {
    if (!previewRef.current || downloading) return;
    setDownloading(true);
    try {
      if (typeof document !== "undefined" && document.fonts?.ready) {
        await document.fonts.ready;
      }

      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const el = previewRef.current;
      const pages = el.querySelectorAll('.resume-page-sheet');
      
      if (pages.length === 0) {
        setDownloading(false);
        return;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      const pdfW = 612; // Letter width in pt
      const pdfH = 792; // Letter height in pt

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        
        const canvas = await html2canvas(pageEl, {
          scale: 2, // Balanced quality/performance
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          width: 816,
          height: 1056,
          windowWidth: 816,
          windowHeight: 1056,
        });

        const imgData = canvas.toDataURL("image/png", 1.0);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");
      }

      if (mode === "print") {
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow?.print();
          // Cleanup after a bit to ensure print dialog is handled
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        };
      } else {
        const base = (employeeName || "resume").trim().replace(/\s+/g, "_");
        pdf.save(`${base}_Brindley_Resume.pdf`);
        toast.success("PDF downloaded.");
      }
    } catch {
      toast.error(mode === "print" ? "Printing failed." : "PDF generation failed.");
    } finally {
      setDownloading(false);
    }
  }, [downloading, employeeName]);


  return (
    <>
      <Toaster position="bottom-right" />

      {/*
        Single capture target: same props as visible preview, always laid out at 100% scale.
        Avoids ref fighting between desktop + mobile sheet and `display:none` on small breakpoints.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 isolate"
        style={{ left: -10000, width: 816 }}
      >
        <ResumePreview
          ref={previewRef}
          {...previewProps}
          activeTab={activeTab}
          isAddingCert={isAddingCert}
          isAddingLicense={isAddingLicense}
          newCertDraft={newCertDraft}
          newLicenseDraft={newLicenseDraft}
        />
      </div>

      <div className="flex h-full flex-col">
        {isPendingReview ? (
          /* ─── PENDING REVIEW: full-width review mode ─── */
          <PendingReviewView
            resumeId={resumeId}
            employeeName={employeeName}
            previewProps={previewProps}
            onDownloadPdf={() => handleExportPdf("download")}
            downloading={downloading}
          />
        ) : status === "APPROVED" ? (
          /* ─── APPROVED: celebratory full-width mode ─── */
          <ApprovedView
            resumeId={resumeId}
            employeeName={employeeName}
            previewProps={previewProps}
            onDownloadPdf={() => handleExportPdf("download")}
            downloading={downloading}
          />
        ) : (
          /* ─── DRAFT / OTHER: normal editor + preview split ─── */
          <>
            {/* ─── Main split view ─── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left panel — editor */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
                {/* Left Header with Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex shrink-0 w-full min-w-0 items-center border-b border-neutral-200 bg-sidebar px-4 sm:px-6 min-h-[56px] lg:min-h-[64px]">
                    <div className="flex flex-1 items-stretch gap-1.5 overflow-hidden py-1 lg:py-2">
                      {tabStripScroll.overflow ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-8 shrink-0 rounded-lg border-border bg-card text-foreground shadow-sm hover:bg-sidebar-accent/50 disabled:opacity-35"
                          disabled={!tabStripScroll.canLeft}
                          aria-label="Ver secciones anteriores"
                          onClick={() => scrollTabStrip(-1)}
                        >
                          <ChevronLeft className="size-3.5" />
                        </Button>
                      ) : null}

                      <div
                        ref={tabStripScrollRef}
                        className="min-h-9 min-w-0 flex-1 overflow-x-auto scroll-smooth rounded-lg border border-border bg-white/40 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        <TabsList
                          variant="default"
                          className="inline-flex h-9 w-max flex-nowrap items-stretch gap-1 border-0 bg-transparent p-1 shadow-none"
                        >
                          {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                              <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="h-7 shrink-0 gap-2 rounded-md border-0 bg-transparent px-3 text-[12px] font-medium text-sidebar-foreground/60 transition-[background-color,box-shadow,transform] duration-200 data-active:bg-primary data-active:text-primary-foreground data-active:hover:text-primary-foreground data-active:shadow-sm"
                              >
                                <Icon className="size-3.5 shrink-0" />
                                <span className="whitespace-nowrap">{tab.label}</span>
                              </TabsTrigger>
                            );
                          })}
                        </TabsList>
                      </div>

                      {tabStripScroll.overflow ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-8 shrink-0 rounded-lg border-border bg-card text-foreground shadow-sm hover:bg-sidebar-accent/50 disabled:opacity-35"
                          disabled={!tabStripScroll.canRight}
                          aria-label="Ver más secciones"
                          onClick={() => scrollTabStrip(1)}
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>

                  </div>
                  
                  {/* Form Container (Relative to allow absolute positioning of actions) */}
                  <div className="relative flex flex-1 flex-col overflow-hidden">
                    {/* Desktop Actions (Absolute, aligned with section titles) */}

                    {/* Scrollable Form Content */}
                    <div 
                      className="flex-1 overflow-y-auto px-4 pb-8 scroll-smooth sm:px-6"
                      onPointerDownCapture={(e) => {
                        // If we're locked but clicking a button (like "Add New Entry"), don't show the hint
                        const isActionButton = (e.target as HTMLElement).closest("button");
                        if (isLocked && !isActionButton) triggerEditHint();
                      }}
                    >
                      {/* Mobile preview + submit actions */}
                      <div className="mb-4 flex flex-wrap items-center justify-center gap-3 lg:hidden">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setMobilePreviewOpen(true)}
                            className="gap-1.5 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                          >
                            <Eye className="size-4" />
                            Preview
                          </Button>
                        </motion.div>

                        {isLocked && !hasUnsavedChanges && status !== "PENDING_APPROVAL" && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setIsSubmitConfirmOpen(true)}
                              disabled={isSubmitting}
                              className="gap-1.5 bg-neutral-900 text-white hover:bg-black shadow-sm"
                            >
                              {isSubmitting ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Send className="size-4" />
                              )}
                              {isSubmitting ? "Submitting…" : "Submit"}
                            </Button>
                          </motion.div>
                        )}
                      </div>

                      {/* ── Personal Info ── */}
                      <TabsContent value="personal" className="mt-0 border-none p-0 outline-none">
                        <PersonalTab
                          data={profileDraft}
                          onChange={handleProfileChange}
                          disabled={isLocked}
                          showValidation={hasUnsavedChanges && !isLocked}
                          headerActions={headerActions}
                        />
                      </TabsContent>

                      {/* ── Experience ── */}
                      <TabsContent value="experience" className="mt-0 border-none p-0 outline-none">
                        <ExperienceTab
                          resumeId={resumeId}
                          initial={draftExperiences}
                          onItemsChange={setDraftExperiences}
                          onPersisted={onSectionPersisted}
                          disabled={isLocked}
                          headerActions={headerActions}
                          onActivateEdit={handleEdit}
                          onAddingChange={setIsAddingExperience}
                          isAdding={isAddingExperience}
                          onNewDraftChange={setNewExperienceDraft}
                        />
                      </TabsContent>

                      {/* ── Licenses ── */}
                      <TabsContent value="licenses" className="mt-0 border-none p-0 outline-none">
                        <LicensesTab
                          resumeId={resumeId}
                          initial={draftLicenses}
                          onItemsChange={setDraftLicenses}
                          onPersisted={onSectionPersisted}
                          disabled={isLocked}
                          headerActions={headerActions}
                          onAddingChange={setIsAddingLicense}
                          onNewDraftChange={setNewLicenseDraft}
                          onActivateEdit={handleEdit}
                          isAdding={isAddingLicense}
                        />
                      </TabsContent>

                      {/* ── Certifications ── */}
                      <TabsContent value="certifications" className="mt-0 border-none p-0 outline-none">
                        <CertificationsTab
                          resumeId={resumeId}
                          initial={draftCertifications}
                          onItemsChange={setDraftCertifications}
                          onPersisted={onSectionPersisted}
                          disabled={isLocked}
                          headerActions={headerActions}
                          onAddingChange={setIsAddingCert}
                          onNewDraftChange={setNewCertDraft}
                          onActivateEdit={handleEdit}
                          isAdding={isAddingCert}
                        />
                      </TabsContent>

                      {/* ── Education ── */}
                      <TabsContent value="education" className="mt-0 border-none p-0 outline-none">
                        <EducationTab
                          resumeId={resumeId}
                          initial={draftEducation}
                          onItemsChange={setDraftEducation}
                          onPersisted={onSectionPersisted}
                          disabled={isLocked}
                          headerActions={headerActions}
                          onActivateEdit={handleEdit}
                          onAddingChange={setIsAddingEducation}
                          isAdding={isAddingEducation}
                          onNewDraftChange={setNewEducationDraft}
                        />
                      </TabsContent>

                      {/* ── Skills ── */}
                      <TabsContent value="skills" className="mt-0 border-none p-0 outline-none">
                        <SkillsTab
                          resumeId={resumeId}
                          initial={draftSkills}
                          onItemsChange={setDraftSkills}
                          onPersisted={onSectionPersisted}
                          disabled={isLocked}
                          headerActions={headerActions}
                          onAddingChange={setIsAddingSkill}
                          onNewDraftChange={setNewSkillDraft}
                          onActivateEdit={handleEdit}
                          isAdding={isAddingSkill}
                        />
                      </TabsContent>

                      {/* ── Achievements ── */}
                      <TabsContent value="achievements" className="mt-0 border-none p-0 outline-none">
                        <AchievementsTab
                          resumeId={resumeId}
                          initial={draftAchievements}
                          onItemsChange={setDraftAchievements}
                          onPersisted={onSectionPersisted}
                          disabled={isLocked}
                          headerActions={headerActions}
                          onActivateEdit={handleEdit}
                          onAddingChange={setIsAddingAchievement}
                          isAdding={isAddingAchievement}
                          onNewDraftChange={setNewAchievementDraft}
                        />
                      </TabsContent>

                      {/* ── Projects ── */}
                      <TabsContent value="projects" className="mt-0 border-none p-0 outline-none">
                        <ProjectsTab
                          resumeId={resumeId}
                          initial={draftProjects}
                          onItemsChange={setDraftProjects}
                          onPersisted={onSectionPersisted}
                          disabled={isLocked}
                          headerActions={headerActions}
                          onAddingChange={setIsAddingProject}
                          onNewDraftChange={setNewProjectDraft}
                          onActivateEdit={handleEdit}
                          isAdding={isAddingProject}
                        />
                      </TabsContent>
                    </div>
                  </div>
                </Tabs>
              </div>

              <div className="hidden min-w-0 flex-1 flex-col border-l border-preview-toolbar-border bg-preview-panel lg:flex">
                {/* Right Header */}
                <div className="flex shrink-0 w-full min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-preview-toolbar-border bg-preview-toolbar px-4 sm:px-6 py-2 min-h-[64px]">
                  {(() => {
                    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                    const isReadyForSubmission = 
                      profileDraft.jobTitle.trim().length > 0 && 
                      draftExperiences.length > 0 &&
                      isValidEmail(profileDraft.personalEmail);
                    
                    return (status === "DRAFT" || status === "NEEDS_CHANGES") && (
                      <div title={!isReadyForSubmission ? "Please ensure Job Title, Email, and at least one Work Experience are valid." : ""}>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSubmitting || isSaving || !isReadyForSubmission}
                          onClick={() => setIsSubmitConfirmOpen(true)}
                          className="h-8 gap-1.5 rounded-full bg-btn-submit px-4 text-[11px] font-semibold text-white shadow-sm hover:bg-btn-submit/90 disabled:opacity-40"
                        >
                          {isSubmitting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Send className="size-3.5" />
                          )}
                          {isSubmitting ? "Sending…" : "Submit Resume"}
                        </Button>
                      </div>
                    );
                  })()}
                  <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-preview-toolbar-border bg-card px-1 py-0.5 shadow-sm">
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 rounded-full text-preview-toolbar-label hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        disabled={zoom <= ZOOM_MIN}
                        aria-label="Zoom out"
                        onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                      >
                        <ZoomOut className="size-4" strokeWidth={2.25} />
                      </Button>
                    </motion.div>
                    <span className="min-w-[2.25rem] px-0.5 text-center text-[10px] font-semibold tabular-nums text-preview-toolbar-label sm:font-medium sm:text-[11px]">
                      {zoom}%
                    </span>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 rounded-full text-preview-toolbar-label hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        disabled={zoom >= ZOOM_MAX}
                        aria-label="Zoom in"
                        onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                      >
                        <ZoomIn className="size-4" strokeWidth={2.25} />
                      </Button>
                    </motion.div>
                  </div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0 rounded-full text-preview-toolbar-label hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      aria-label="Reset zoom to default"
                      title="Reset zoom"
                      onClick={resetPreviewZoom}
                    >
                      <RotateCcw className="size-[16px]" strokeWidth={2.25} />
                    </Button>
                  </motion.div>
                  <span className="h-4 w-px bg-preview-toolbar-border" />
                  <div className="flex items-center gap-1">
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-full text-preview-toolbar-label hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        onClick={() => handleExportPdf("print")}
                        aria-label="Print"
                      >
                        <Printer className="size-[16px]" strokeWidth={2.25} />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        type="button"
                        disabled={downloading}
                        onClick={() => handleExportPdf("download")}
                        className="h-7 gap-1.5 rounded-full bg-primary px-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 text-[11px]"
                      >
                        {downloading ? (
                          <Loader2 className="size-[12px] animate-spin" />
                        ) : (
                          <Download className="size-[12px]" />
                        )}
                        {downloading ? "Generating…" : "PDF"}
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Scrollable preview canvas */}
                <div className="flex flex-1 justify-center overflow-auto p-0">
                  <div
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top center",
                      marginBottom: `calc((${zoom / 100} - 1) * 100%)`,
                    }}
                  >
                    {/* ── Desktop Preview ── */}
                    <ResumePreview
                      {...previewProps}
                      activeTab={activeTab}
                      isAddingCert={isAddingCert}
                      isAddingExperience={isAddingExperience}
                      isAddingEducation={isAddingEducation}
                      isAddingAchievement={isAddingAchievement}
                      isAddingLicense={isAddingLicense}
                      isAddingProject={isAddingProject}
                      isAddingSkill={isAddingSkill}
                      newCertDraft={newCertDraft}
                      newLicenseDraft={newLicenseDraft}
                      newProjectDraft={newProjectDraft}
                      newSkillDraft={newSkillDraft}
                      newExperienceDraft={newExperienceDraft}
                      newEducationDraft={newEducationDraft}
                      newAchievementDraft={newAchievementDraft}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Custom Mobile Preview Overlay (Native Implementation) */}
      <AnimatePresence>
        {mobilePreviewOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex flex-col bg-[#E0DBD4]"
          >
            {/* Header */}
            <div className="flex h-16 shrink-0 flex-row items-center justify-between border-b border-preview-toolbar-border bg-preview-toolbar px-4 shadow-sm">
              <div className="flex items-center gap-2">
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => setMobilePreviewOpen(false)}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                </motion.div>
                <h2 className="text-sm font-bold text-foreground">Preview</h2>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <div className="inline-flex items-center gap-0.5 rounded-full border border-preview-toolbar-border bg-white px-1 py-0.5 shadow-sm">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-full text-preview-toolbar-label"
                    disabled={mobileZoom <= ZOOM_MIN}
                    onClick={() => setMobileZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                  >
                    <ZoomOut className="size-3.5" />
                  </Button>
                  <span className="min-w-[2.5rem] text-center text-[11px] font-bold tabular-nums">
                    {mobileZoom}%
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-full text-preview-toolbar-label"
                    disabled={mobileZoom >= ZOOM_MAX}
                    onClick={() => setMobileZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                  >
                    <ZoomIn className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full bg-primary px-3 text-[11px] font-bold text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleExportPdf("download")}
                >
                  <Download className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Scaled Preview Body */}
            <div className="flex-1 overflow-auto p-4 pb-20">
              <div className="flex justify-center">
                <div 
                  className="origin-top shadow-2xl transition-transform duration-200"
                  style={{ 
                    width: '816px',
                    // Scale logic: base on user zoom setting
                    transform: `scale(${mobileZoom / 100})`, 
                  }}
                >
                  <ResumePreview
                  {...previewProps}
                  className="w-full"
                  activeTab={activeTab}
                  isAddingCert={isAddingCert}
                  isAddingExperience={isAddingExperience}
                  isAddingEducation={isAddingEducation}
                  isAddingAchievement={isAddingAchievement}
                  isAddingLicense={isAddingLicense}
                  isAddingProject={isAddingProject}
                  isAddingSkill={isAddingSkill}
                  newCertDraft={newCertDraft}
                  newLicenseDraft={newLicenseDraft}
                  newProjectDraft={newProjectDraft}
                  newSkillDraft={newSkillDraft}
                  newExperienceDraft={newExperienceDraft}
                  newEducationDraft={newEducationDraft}
                  newAchievementDraft={newAchievementDraft}
                  disableScrollIntoView={activeTab === "personal"}
                />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isSubmitConfirmOpen} onOpenChange={setIsSubmitConfirmOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Send className="size-5" />
              </div>
              <DialogTitle className="text-xl">Ready to Submit?</DialogTitle>
            </div>
            <DialogDescription className="pt-3 text-[14px] leading-relaxed text-neutral-600">
              Once you submit your resume, it will be <span className="font-bold text-neutral-900">locked for review</span> by the Talent Selection team.
              <br /><br />
              You won't be able to make further changes until the review process is complete. Are you sure you are ready?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSubmitConfirmOpen(false)}
              className="h-10 rounded-lg border-neutral-200 font-medium hover:bg-neutral-50 sm:flex-1"
            >
              Not yet
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsSubmitConfirmOpen(false);
                void handleSubmitFinal();
              }}
              className="h-10 rounded-lg bg-primary font-bold text-primary-foreground shadow-md hover:bg-primary/90 sm:flex-1"
            >
              Yes, Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
