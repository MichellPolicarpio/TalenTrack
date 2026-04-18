"use client";

import { Lock, LockOpen, Save, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EditorActionBarProps = {
  isLocked: boolean;
  hasUnsavedChanges: boolean;
  /** false when status is PENDING_APPROVAL — cannot unlock during HR review */
  canEdit: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onSubmit: () => void;
  children?: React.ReactNode;
};

export function EditorActionBar({
  isLocked,
  hasUnsavedChanges,
  canEdit,
  isSaving,
  isSubmitting,
  onEdit,
  onCancel,
  onSave,
  onSubmit,
}: EditorActionBarProps) {
  const canSave = !isLocked && hasUnsavedChanges && !isSaving && !isSubmitting;
  const canSubmit =
    isLocked && !hasUnsavedChanges && !isSubmitting && !isSaving && canEdit;

  return (
    <div className="flex flex-wrap items-center gap-2">


      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        {isLocked ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canEdit || isSaving || isSubmitting}
            onClick={onEdit}
            className="h-9 gap-1.5 rounded-lg border-neutral-200/90 bg-white text-[13px] font-medium shadow-sm hover:bg-neutral-50"
          >
            <LockOpen className="size-3.5" />
            Edit
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canEdit || isSaving || isSubmitting}
            onClick={onCancel}
            className="h-9 gap-1.5 rounded-lg border-neutral-200/90 bg-white text-[13px] font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
          >
            <X className="size-3.5" />
            Cancel
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          disabled={!canSave}
          onClick={onSave}
          className="h-9 gap-1.5 rounded-lg bg-[#F17A28] text-[13px] font-semibold text-white shadow-sm hover:bg-[#E06D22] disabled:opacity-40"
        >
          {isSaving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          {isSaving ? "Saving…" : "Save"}
        </Button>


      </div>
    </div>
  );
}
