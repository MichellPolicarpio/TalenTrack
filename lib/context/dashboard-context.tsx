"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import type { ResumeStatus } from "@/lib/db/types";

type EditorActions = {
  isLocked: boolean;
  hasUnsavedChanges: boolean;
  canEdit: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onSubmit: () => void;
} | null;

type DashboardContextType = {
  activeResumeStatus: ResumeStatus | null;
  setActiveResumeStatus: (status: ResumeStatus | null) => void;
  editorActions: EditorActions;
  setEditorActions: (actions: EditorActions) => void;
  isEditHintActive: boolean;
  triggerEditHint: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeResumeStatus, setActiveResumeStatus] = useState<ResumeStatus | null>(null);
  const [isEditHintActive, setIsEditHintActive] = useState(false);
  const [editorActions, setEditorActions] = useState<EditorActions>(null);

  const stableSetActiveResumeStatus = useCallback((status: ResumeStatus | null) => {
    setActiveResumeStatus(status);
  }, []);

  const stableSetEditorActions = useCallback((actions: EditorActions) => {
    setEditorActions(actions);
  }, []);

  const triggerEditHint = useCallback(() => {
    setIsEditHintActive(true);
    const timer = setTimeout(() => setIsEditHintActive(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const value = useMemo(() => ({
    activeResumeStatus,
    setActiveResumeStatus: stableSetActiveResumeStatus,
    editorActions,
    setEditorActions: stableSetEditorActions,
    isEditHintActive,
    triggerEditHint,
  }), [activeResumeStatus, stableSetActiveResumeStatus, editorActions, stableSetEditorActions, isEditHintActive, triggerEditHint]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
