"use client";

import { useRef, useState, useCallback, useMemo, useLayoutEffect, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { StatusBanner } from "@/components/resume/StatusBanner";
import {
  ResumePreview,
  type ResumePreviewProps,
} from "@/components/resume/ResumePreview";
import { PendingReviewView } from "@/components/resume/PendingReviewView";
import { ApprovedView } from "@/components/resume/ApprovedView";
import { PersonalTab } from "@/components/resume/tabs/PersonalTab";
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
  ResumeProject,
  License,
} from "@/lib/db/types";
import type { UserRole } from "@/types/user-role";
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
    linkedInUrl: null,
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
    linkedInUrl: draft.linkedInUrl.trim() || null,
    homeAddress: draft.homeAddress.trim() || null,
    personalPhone: draft.personalPhone.trim() || null,
    personalEmail: draft.personalEmail.trim() || null,
  };
}

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
  resumeProjects: ResumeProject[];
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
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "projects", label: "Projects", icon: FolderKanban },
  { value: "skills", label: "Skills", icon: Sparkles },
  { value: "certifications", label: "Certifications", icon: BadgeCheck },
  { value: "licenses", label: "Licenses", icon: Trophy }, // Using Trophy for licenses for now, or I can use another icon.
  { value: "achievements", label: "Achievements", icon: Trophy },
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
  resumeProjects,
  licenses,
}: ResumeEditorClientProps) {
  // ── Preview state ──
  const previewRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const { setActiveResumeStatus } = useDashboard();

  useLayoutEffect(() => {
    setActiveResumeStatus(status);
    return () => setActiveResumeStatus(null);
  }, [status, setActiveResumeStatus]);

  useLayoutEffect(() => {
    const mq = window.matchMedia(
      `(min-width: ${LARGE_PREVIEW_MIN_WIDTH_PX}px)`,
    );
    if (mq.matches) {
      setZoom(ZOOM_DEFAULT_LARGE);
    }
  }, []);

  const resetPreviewZoom = useCallback(() => {
    const mq = window.matchMedia(
      `(min-width: ${LARGE_PREVIEW_MIN_WIDTH_PX}px)`,
    );
    setZoom(mq.matches ? ZOOM_DEFAULT_LARGE : ZOOM_DEFAULT);
  }, []);

  useLayoutEffect(() => {
    const el = editorChromeRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setEditorChromeHeight(el.getBoundingClientRect().height);
    });
    ro.observe(el);
    setEditorChromeHeight(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, []);
  const [downloading, setDownloading] = useState(false);

  // ── Editor lock/edit/save/submit state machine ──
  const [isLocked, setIsLocked] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setEditorActions } = useDashboard();

  const tabStripScrollRef = useRef<HTMLDivElement>(null);
  /** Left header (status + actions) height so the preview chrome matches and seams align. */
  const editorChromeRef = useRef<HTMLDivElement>(null);
  const [editorChromeHeight, setEditorChromeHeight] = useState(0);

  const [tabStripScroll, setTabStripScroll] = useState({
    overflow: false,
    canLeft: false,
    canRight: false,
  });

  const refreshTabStripScroll = useCallback(() => {
    const el = tabStripScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 2;
    setTabStripScroll({
      overflow,
      canLeft: overflow && scrollLeft > 2,
      canRight: overflow && scrollLeft + clientWidth < scrollWidth - 2,
    });
  }, []);

  useLayoutEffect(() => {
    const el = tabStripScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => refreshTabStripScroll());
    ro.observe(el);
    el.addEventListener("scroll", refreshTabStripScroll, { passive: true });
    window.addEventListener("resize", refreshTabStripScroll);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", refreshTabStripScroll);
      window.removeEventListener("resize", refreshTabStripScroll);
    };
  }, [refreshTabStripScroll]);

  useLayoutEffect(() => {
    refreshTabStripScroll();
    const root = tabStripScrollRef.current;
    if (!root) return;
    const id = requestAnimationFrame(() => {
      const activeEl = root.querySelector("[data-active]");
      if (activeEl instanceof HTMLElement) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "nearest",
          block: "nearest",
        });
      }
      refreshTabStripScroll();
    });
    return () => cancelAnimationFrame(id);
  }, [activeTab, refreshTabStripScroll]);

  const scrollTabStrip = useCallback((direction: -1 | 1) => {
    const el = tabStripScrollRef.current;
    if (!el) return;
    const delta = Math.max(180, Math.floor(el.clientWidth * 0.55));
    el.scrollBy({ left: direction * delta, behavior: "smooth" });
  }, []);

  // ── Personal (profile) draft form ──
  const [profileDraft, setProfileDraft] = useState<PersonalDraft>({
    jobTitle:              profile?.jobTitle ?? "",
    professionalSummary:   profile?.professionalSummary ?? "",
    linkedInUrl:           profile?.linkedInUrl ?? "",
    homeAddress:           profile?.homeAddress ?? "",
    personalPhone:         profile?.personalPhone ?? "",
    personalEmail:         profile?.personalEmail ?? "",
  });

  // Cannot unlock while resume is under HR review
  const isPendingReview = status === "PENDING_APPROVAL";

  const serverSavedAt = useMemo(
    () =>
      latestOf(
        coerceDate(resumeUpdatedAt),
        coerceDate(profile?.updatedAt),
      ),
    [resumeUpdatedAt, profile?.updatedAt],
  );

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(serverSavedAt);
  const router = useRouter();

  useLayoutEffect(() => {
    setLastSavedAt((prev) => {
      if (!serverSavedAt) return prev;
      if (!prev || serverSavedAt.getTime() >= prev.getTime()) {
        return serverSavedAt;
      }
      return prev;
    });
  }, [serverSavedAt]);

  const bumpLastSaved = useCallback(() => {
    setLastSavedAt(new Date());
  }, []);

  const onSectionPersisted = useCallback(() => {
    bumpLastSaved();
    router.refresh();
  }, [bumpLastSaved, router]);

  // ── Visible items for the preview panel ──
  const visibleExperiences    = experiences.filter((e) => e.isVisibleOnResume);
  const visibleEducation      = education.filter((e) => e.isVisibleOnResume);
  const visibleSkills         = skills.filter((s) => s.isVisibleOnResume);
  const visibleCertifications = certifications.filter((c) => c.isVisibleOnResume);
  const [draftExperiences, setDraftExperiences] = useState(() => structuredClone(experiences));
  const [draftEducation, setDraftEducation] = useState(() => structuredClone(education));
  const [draftSkills, setDraftSkills] = useState(() => structuredClone(skills));
  const [draftAchievements, setDraftAchievements] = useState(() => structuredClone(achievements));
  const [draftResumeProjects, setDraftResumeProjects] = useState(() => structuredClone(resumeProjects));
  const [draftLicenses, setDraftLicenses] = useState(() => structuredClone(licenses));
  const [draftCertifications, setDraftCertifications] = useState(() => structuredClone(certifications));

  useLayoutEffect(() => {
    setDraftExperiences(structuredClone(experiences));
    setDraftEducation(structuredClone(education));
    setDraftSkills(structuredClone(skills));
    setDraftAchievements(structuredClone(achievements));
    setDraftResumeProjects(structuredClone(resumeProjects));
    setDraftLicenses(structuredClone(licenses));
    setDraftCertifications(structuredClone(certifications));
  }, [experiences, education, skills, achievements, resumeProjects, licenses, certifications]);

  const previewProfile = useMemo(
    () => buildPreviewProfile(profile, profileDraft, resumeId),
    [profile, profileDraft, resumeId],
  );

  /** Same props for on-screen previews and the off-screen PDF capture (must stay in sync). */
  const previewProps: ResumePreviewProps = useMemo(
    () => ({
      employeeName,
      profile: previewProfile,
      experiences: draftExperiences.filter((e) => e.isVisibleOnResume),
      education: draftEducation.filter((e) => e.isVisibleOnResume),
      skills: draftSkills.filter((s) => s.isVisibleOnResume),
      certifications: draftCertifications.filter((c) => c.isVisibleOnResume),
      resumeProjects: draftResumeProjects.filter((p) => p.isVisibleOnResume),
      licenses: draftLicenses.filter((l) => l.isVisibleOnResume),
    }),
    [
      employeeName,
      previewProfile,
      draftExperiences,
      draftEducation,
      draftSkills,
      draftCertifications,
      draftResumeProjects,
      draftLicenses,
    ],
  );

  // ── Handler: change a profile field → mark unsaved ──
  const handleProfileChange = useCallback((field: keyof PersonalDraft, value: string) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // ── Handler: Edit button ──
  const handleEdit = useCallback(() => {
    setIsLocked(false);
  }, []);

  // ── Handler: Cancel editing — discard drafts and lock again ──
  const handleCancelEdit = useCallback(() => {
    if (isLocked || isPendingReview || isSaving || isSubmitting) return;
    setProfileDraft({
      jobTitle: profile?.jobTitle ?? "",
      professionalSummary: profile?.professionalSummary ?? "",
      linkedInUrl: profile?.linkedInUrl ?? "",
      homeAddress: profile?.homeAddress ?? "",
      personalPhone: profile?.personalPhone ?? "",
      personalEmail: profile?.personalEmail ?? "",
    });
    setDraftExperiences(structuredClone(experiences));
    setDraftEducation(structuredClone(education));
    setDraftSkills(structuredClone(skills));
    setDraftAchievements(structuredClone(achievements));
    setDraftResumeProjects(structuredClone(resumeProjects));
    setDraftLicenses(structuredClone(licenses));
    setDraftCertifications(structuredClone(certifications));
    setHasUnsavedChanges(false);
    setIsLocked(true);
    toast.info("Changes discarded.");
  }, [
    isLocked,
    isPendingReview,
    isSaving,
    isSubmitting,
    profile,
    experiences,
    education,
    skills,
    achievements,
    resumeProjects,
    licenses,
    certifications,
  ]);

  // ── Handler: Save button ──
  const handleSave = useCallback(async () => {
    if (isLocked || !hasUnsavedChanges || isSaving) return;
    if (!profileDraft.jobTitle.trim()) {
      toast.error("Job title is required before saving.");
      setActiveTab("personal");
      return;
    }
    setIsSaving(true);
    try {
      const { approvalInvalidated } = await saveProfileAction(resumeId, {
        jobTitle:            profileDraft.jobTitle.trim(),
        professionalSummary: profileDraft.professionalSummary.trim(),
        linkedInUrl:         profileDraft.linkedInUrl.trim() || null,
        homeAddress:         profileDraft.homeAddress.trim() || null,
        personalPhone:       profileDraft.personalPhone.trim() || null,
        personalEmail:       profileDraft.personalEmail.trim() || null,
      });
      toast.success(
        approvalInvalidated
          ? "Cambios guardados. La aprobación de HR quedó anulada; vuelve a enviar a revisión cuando esté listo."
          : "Cambios guardados correctamente.",
      );
      setHasUnsavedChanges(false);
      setIsLocked(true);
      bumpLastSaved();
      router.refresh();
    } catch {
      toast.error("Could not save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    isLocked,
    hasUnsavedChanges,
    isSaving,
    profileDraft,
    resumeId,
    bumpLastSaved,
    router,
  ]);

  // ── Handler: Submit button ──
  const handleSubmitFinal = useCallback(async () => {
    if (!isLocked || hasUnsavedChanges || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitForApprovalAction(resumeId);
      toast.success("Resume submitted for HR review.");
      router.refresh();
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isLocked, hasUnsavedChanges, isSubmitting, resumeId, router]);

  // Register actions in the header global context
  useEffect(() => {
    setEditorActions({
      isLocked,
      hasUnsavedChanges,
      canEdit: !isLocked || status !== "PENDING_APPROVAL",
      isSaving,
      isSubmitting,
      onEdit: handleEdit,
      onSave: handleSave,
      onCancel: handleCancelEdit,
      onSubmit: handleSubmitFinal,
    });
    return () => setEditorActions(null);
  }, [
    isLocked,
    hasUnsavedChanges,
    status,
    isSaving,
    isSubmitting,
    handleEdit,
    handleSave,
    handleCancelEdit,
    handleSubmitFinal,
    setEditorActions,
  ]);

  const headerActions = useMemo(() => (
    (!isLocked || hasUnsavedChanges || status === "DRAFT" || status === "NEEDS_CHANGES") ? (
      <EditorActionBar
        isLocked={isLocked}
        hasUnsavedChanges={hasUnsavedChanges}
        canEdit={!isLocked || status === "DRAFT" || status === "NEEDS_CHANGES"}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancelEdit}
        onSubmit={handleSubmitFinal}
      />
    ) : null
  ), [isLocked, hasUnsavedChanges, status, isSaving, isSubmitting, handleEdit, handleSave, handleCancelEdit, handleSubmitFinal]);

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
          scale: 3, // High quality
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

  // ── On-screen preview (no ref — PDF uses dedicated off-screen instance below) ──
  const previewContent = <ResumePreview {...previewProps} />;

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
        <ResumePreview ref={previewRef} {...previewProps} />
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
                  <div className="flex shrink-0 w-full min-w-0 items-center border-b border-neutral-200 bg-sidebar px-4 sm:px-6 min-h-[64px]">
                    <div className="flex flex-1 items-stretch gap-1.5 overflow-hidden py-2">
                      {tabStripScroll.overflow ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-8 shrink-0 rounded-lg border-neutral-200/90 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-35"
                          disabled={!tabStripScroll.canLeft}
                          aria-label="Ver secciones anteriores"
                          onClick={() => scrollTabStrip(-1)}
                        >
                          <ChevronLeft className="size-3.5" />
                        </Button>
                      ) : null}

                      <div
                        ref={tabStripScrollRef}
                        className="min-h-9 min-w-0 flex-1 overflow-x-auto scroll-smooth rounded-lg border border-neutral-200/90 bg-neutral-100/30 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                                className="h-7 shrink-0 gap-2 rounded-md border-0 bg-transparent px-3 text-[12px] font-medium text-neutral-500 shadow-none transition-all data-active:bg-[#FF6C06] data-active:text-white data-active:shadow-sm"
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
                          className="h-9 w-8 shrink-0 rounded-lg border-neutral-200/90 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-35"
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
                    <div className="flex-1 overflow-y-auto px-6 pt-3 pb-8 scroll-smooth">
                      {/* Mobile preview button */}
                      <div className="mb-4 flex items-center justify-end lg:hidden">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setMobilePreviewOpen(true)}
                          className="gap-1.5"
                        >
                          <Eye className="size-4" />
                          Preview
                        </Button>
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
                        />
                      </TabsContent>

                      {/* ── Projects ── */}
                      <TabsContent value="projects" className="mt-0 border-none p-0 outline-none">
                        <ProjectsTab
                          resumeId={resumeId}
                          initial={draftResumeProjects}
                          onItemsChange={setDraftResumeProjects}
                          onPersisted={onSectionPersisted}
                          disabled={isLocked}
                          headerActions={headerActions}
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
                        />
                      </TabsContent>

                      <TabsContent value="licenses" className="mt-0 border-none p-0 outline-none">
                        <LicensesTab
                          resumeId={resumeId}
                          initial={draftLicenses}
                          onItemsChange={setDraftLicenses}
                          onPersisted={onSectionPersisted}
                          disabled={isLocked}
                          headerActions={headerActions}
                        />
                      </TabsContent>
                    </div>
                  </div>
                </Tabs>
              </div>

              <div className="hidden min-w-0 flex-1 flex-col border-l border-neutral-100 bg-[#F3F4F6] lg:flex">
                {/* Right Header */}
                <div className="flex shrink-0 w-full min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-neutral-200 bg-sidebar px-4 sm:px-6 py-2 min-h-[64px]">
                  {isLocked && !hasUnsavedChanges && (status === "DRAFT" || status === "NEEDS_CHANGES") && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSubmitting || isSaving}
                      onClick={handleSubmitFinal}
                      className="h-8 gap-1.5 rounded-full bg-neutral-900 px-4 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-40"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      {isSubmitting ? "Sending…" : "Submit Resume"}
                    </Button>
                  )}
                  <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-neutral-200/90 bg-neutral-50/95 px-1 py-0.5 shadow-sm shadow-neutral-200/30">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-full text-neutral-600 hover:bg-white hover:text-neutral-900"
                      disabled={zoom <= ZOOM_MIN}
                      aria-label="Zoom out"
                      onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                    >
                      <ZoomOut className="size-4" strokeWidth={2.25} />
                    </Button>
                    <span className="min-w-[2.25rem] px-0.5 text-center text-[10px] font-semibold tabular-nums text-neutral-700 sm:font-medium sm:text-[11px]">
                      {zoom}%
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-full text-neutral-600 hover:bg-white hover:text-neutral-900"
                      disabled={zoom >= ZOOM_MAX}
                      aria-label="Zoom in"
                      onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                    >
                      <ZoomIn className="size-4" strokeWidth={2.25} />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    aria-label="Reset zoom to default"
                    title="Reset zoom"
                    onClick={resetPreviewZoom}
                  >
                    <RotateCcw className="size-[16px]" strokeWidth={2.25} />
                  </Button>
                  <span className="h-4 w-px bg-neutral-200" />
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      onClick={() => handleExportPdf("print")}
                      aria-label="Print"
                    >
                      <Printer className="size-[16px]" strokeWidth={2.25} />
                    </Button>
                    <Button
                      type="button"
                      disabled={downloading}
                      onClick={() => handleExportPdf("download")}
                      className="h-7 gap-1.5 rounded-full bg-[#FF6C06] px-3 font-semibold text-white transition-colors hover:bg-[#D4691A] disabled:opacity-60 text-[11px]"
                    >
                      {downloading ? (
                        <Loader2 className="size-[12px] animate-spin" />
                      ) : (
                        <Download className="size-[12px]" />
                      )}
                      {downloading ? "Generating…" : "PDF"}
                    </Button>
                  </div>
                </div>

                {/* Scrollable preview canvas */}
                <div className="flex flex-1 justify-center overflow-auto p-6">
                  <div
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top center",
                      marginBottom: `calc((${zoom / 100} - 1) * 100%)`,
                    }}
                  >
                    {previewContent}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile preview sheet */}
      <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Resume Preview
              <Button
                type="button"
                size="sm"
                className="gap-1.5 bg-[#FF6C06] text-white hover:bg-[#D06A1D]"
                onClick={() => handleExportPdf("download")}
              >
                <Download className="size-3.5" /> PDF
              </Button>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-auto">
            <div style={{ transform: "scale(0.42)", transformOrigin: "top left", width: "238%" }}>
              {previewContent}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
