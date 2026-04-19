import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { saveProfileAction } from "@/lib/actions/profile.actions";
import { submitForApprovalAction } from "@/lib/actions/approval.actions";
import { useDashboard } from "@/lib/context/dashboard-context";
import type { ResumeStatus } from "@/lib/db/types";
import type { PersonalDraft } from "@/components/resume/tabs/PersonalTab";

export function useResumeEditor({
  resumeId,
  status,
  profileDraft,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  resetDrafts,
  bumpLastSaved,
}: {
  resumeId: string;
  status: ResumeStatus;
  profileDraft: PersonalDraft;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
  resetDrafts: () => void;
  bumpLastSaved: () => void;
}) {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setEditorActions } = useDashboard();
  const router = useRouter();

  const isPendingReview = status === "PENDING_APPROVAL";

  const handleEdit = useCallback(() => {
    setIsLocked(false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (isLocked || isPendingReview || isSaving || isSubmitting) return;
    resetDrafts();
    setHasUnsavedChanges(false);
    setIsLocked(true);
    toast.info("Changes discarded.");
  }, [isLocked, isPendingReview, isSaving, isSubmitting, resetDrafts, setHasUnsavedChanges]);

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
        homeAddress:         profileDraft.homeAddress.trim() || null,
        personalPhone:       profileDraft.personalPhone.trim() || null,
        personalEmail:       profileDraft.personalEmail.trim() || null,
      });
      toast.success(
        approvalInvalidated
          ? "Changes saved. Approval invalidated; resubmit when ready."
          : "Changes saved successfully.",
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
    setHasUnsavedChanges,
  ]);

  const handleSubmitFinal = useCallback(async () => {
    if (isSubmitting) return;
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

  return {
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
  };
}
