import React, { useState, useEffect, useTransition, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { 
  PointerSensor, 
  useSensor, 
  useSensors, 
  closestCenter,
  DragEndEvent 
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toggleVisibilityAction } from "@/lib/actions/sections.actions";
import type { ReorderItem } from "@/lib/db/types";

export type GenericSectionItem = {
  id: string;
  isVisibleOnResume: boolean;
  sortOrder: number;
};

export function useGenericSection<T extends GenericSectionItem>({
  resumeId,
  tableName,
  initial,
  onItemsChange,
  onPersisted,
  removeAction,
  reorderAction,
  headerActions,
  onAddingChange,
}: {
  resumeId: string;
  tableName: "WorkExperiences" | "Education" | "Skills" | "Certifications" | "Achievements" | "ResumeProjects" | "Licenses";
  initial: T[];
  onItemsChange?: (items: T[]) => void;
  onPersisted?: () => void;
  removeAction: (resumeId: string, id: string) => Promise<void>;
  reorderAction: (resumeId: string, items: ReorderItem[]) => Promise<void>;
  headerActions?: React.ReactNode;
  onAddingChange?: (isAdding: boolean) => void;
}) {
  const [items, setItems] = useState<T[]>(initial);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor));

  const [localDirty, setLocalDirty] = useState(false);
  const [activeSave, setActiveSave] = useState<(() => void) | null>(null);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    onAddingChange?.(open);
  }, [open, onAddingChange]);

  const hijackedActions = useMemo(() => {
    if (!React.isValidElement(headerActions)) return headerActions;
    return React.cloneElement(headerActions as React.ReactElement<any>, {
      onSave: localDirty && activeSave ? activeSave : (headerActions.props as any).onSave,
      hasUnsavedChanges: localDirty || (headerActions.props as any).hasUnsavedChanges,
    });
  }, [headerActions, localDirty, activeSave]);

  const updateItems = useCallback((updater: (prev: T[]) => T[]) => {
    setItems((prev) => {
      const next = updater(prev);
      if (onItemsChange) setTimeout(() => onItemsChange(next), 0);
      return next;
    });
  }, [onItemsChange]);

  const handleDraftChange = useCallback((id: string, patch: Partial<T>) => {
    updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, [updateItems]);

  const handleToggleVisibility = useCallback((id: string, visible: boolean) => {
    updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, isVisibleOnResume: visible } : i)));
    startTransition(async () => {
      try {
        await toggleVisibilityAction(resumeId, tableName, id, visible);
        onPersisted?.();
      } catch {
        updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, isVisibleOnResume: !visible } : i)));
        toast.error("Could not update visibility.");
      }
    });
  }, [resumeId, tableName, onPersisted, updateItems]);

  const handleDelete = useCallback((id: string) => {
    startTransition(async () => {
      try {
        await removeAction(resumeId, id);
        updateItems((prev) => prev.filter((i) => i.id !== id));
        toast.success("Entry deleted.");
        onPersisted?.();
      } catch {
        toast.error("Could not delete.");
      }
    });
  }, [resumeId, removeAction, onPersisted, updateItems]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));
    updateItems(() => reordered);
    startTransition(async () => {
      try {
        await reorderAction(
          resumeId,
          reordered.map((i) => ({ id: i.id, sortOrder: i.sortOrder })),
        );
        onPersisted?.();
      } catch {
        toast.error("Could not save order.");
      }
    });
  }, [resumeId, items, reorderAction, onPersisted, updateItems]);

  return {
    items,
    setItems,
    open,
    setOpen,
    pending,
    sensors,
    hijackedActions,
    handleDraftChange,
    handleToggleVisibility,
    handleDelete,
    handleDragEnd,
    setLocalDirty,
    setActiveSave,
    updateItems,
  };
}
