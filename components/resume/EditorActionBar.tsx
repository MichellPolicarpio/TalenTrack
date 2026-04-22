"use client";

import { Lock, LockOpen, Save, Send, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/lib/context/dashboard-context";

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

  const { isEditHintActive } = useDashboard();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        {isLocked ? (
          <div className="relative">
            <AnimatePresence>
              {isEditHintActive && canEdit && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: { type: "spring", damping: 15, stiffness: 300 } 
                  }}
                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  className="absolute top-full left-1/2 mt-3 w-max -translate-x-1/2 z-[100] pointer-events-none"
                >
                  <div className="relative rounded-xl bg-primary px-4 py-1.5 text-[12px] font-bold text-white shadow-xl animate-bounce-subtle">
                    Click here to edit!
                    <div className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-primary" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canEdit || isSaving || isSubmitting}
              onClick={onEdit}
              className="h-8 lg:h-9 gap-1.5 rounded-lg border-border bg-card text-[12px] lg:text-[13px] font-medium text-foreground shadow-sm hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            >
              <LockOpen className="size-3 lg:size-3.5" />
              Edit
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canEdit || isSaving || isSubmitting}
            onClick={onCancel}
            className="h-8 lg:h-9 gap-1.5 rounded-lg border-border bg-card text-[12px] lg:text-[13px] font-medium text-foreground shadow-sm hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <X className="size-3 lg:size-3.5" />
            Cancel
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          disabled={!canSave}
          onClick={onSave}
          className="h-8 lg:h-9 gap-1.5 rounded-lg bg-primary text-[12px] lg:text-[13px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40"
        >
          {isSaving ? (
            <Loader2 className="size-3 lg:size-3.5 animate-spin" />
          ) : (
            <Save className="size-3 lg:size-3.5" />
          )}
          {isSaving ? "Saving…" : "Save"}
        </Button>

        {canSubmit && (
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-8 lg:h-9 gap-1.5 rounded-lg bg-green-600 text-[12px] lg:text-[13px] font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-40"
          >
            {isSubmitting ? (
              <Loader2 className="size-3 lg:size-3.5 animate-spin" />
            ) : (
              <Send className="size-3 lg:size-3.5" />
            )}
            {isSubmitting ? "Submitting…" : "Submit to Review"}
          </Button>
        )}


      </div>
    </div>
  );
}
