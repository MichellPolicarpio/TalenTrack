"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, formatTitleCase } from "@/lib/utils";
import {
  GripVertical,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  saveSkill,
  removeSkill,
  reorderSkillsAction,
  toggleVisibilityAction,
} from "@/lib/actions/sections.actions";
import type { Skill, SkillInput } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionShell } from "./SectionShell";
import { useGenericSection } from "@/lib/hooks/useGenericSection";
import { DeleteConfirmPopover } from "./DeleteConfirmPopover";


function SkillCard({
  item,
  resumeId,
  onDelete,
  onToggleVisibility,
  onDraftChange,
  onPersisted,
  onDirtyChange,
  disabled,
}: {
  item: Skill;
  resumeId: string;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDraftChange: (id: string, patch: Partial<Skill>) => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const initial: SkillInput = {
    id: item.id,
    skillName: item.skillName,
  };

  const [baseline, setBaseline] = useState<SkillInput>(initial);
  const [form, setForm] = useState<SkillInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();
  const [showValidation, setShowValidation] = useState(false);

  const skillEmpty = showValidation && !form.skillName.trim();

  function update(patch: Partial<SkillInput>) {
    const nextForm = { ...form, ...patch };
    setForm(nextForm);
    
    const draftPatch: Partial<Skill> = {};
    if (patch.skillName !== undefined) draftPatch.skillName = patch.skillName;

    onDraftChange(item.id, draftPatch);
    if (!dirty) {
      setDirty(true);
      onDirtyChange?.(true, handleSave);
    }
  }

  useEffect(() => {
    if (dirty) {
      onDirtyChange?.(true, handleSave);
    }
  }, [form, dirty]);

  function handleSave() {
    if (!form.skillName.trim()) {
      setShowValidation(true);
      toast.error("Please fill in the skill name.");
      return;
    }

    startSave(async () => {
      try {
        await saveSkill(resumeId, form);
        toast.success("Skill saved.");
        setBaseline(form);
        setDirty(false);
        setShowValidation(false);
        onDirtyChange?.(false, () => {});
        onPersisted?.();
      } catch {
        toast.error("Could not save.");
      }
    });
  }

  function handleCancel() {
    setForm(baseline);
    onDraftChange(item.id, {
      skillName: baseline.skillName,
    });
    setDirty(false);
    onDirtyChange?.(false, () => {});
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-md sm:gap-4 sm:p-5",
        isDragging && "z-50 opacity-50",
        !item.isVisibleOnResume && "opacity-60 bg-neutral-50/50",
      )}
    >
      <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-r border-neutral-100 pr-3 sm:gap-3 sm:pr-4">
        <button
          type="button"
          onClick={() => onToggleVisibility(item.id, !item.isVisibleOnResume)}
          className="rounded-md p-1 transition-colors hover:bg-neutral-100"
          title={item.isVisibleOnResume ? "Hide from resume" : "Show on resume"}
        >
          {item.isVisibleOnResume ? (
            <Eye className="size-4 text-[#16A34A]" />
          ) : (
            <EyeOff className="size-4 text-[#9CA3AF]" />
          )}
        </button>
        <DeleteConfirmPopover
          disabled={disabled}
          onConfirm={() => onDelete(item.id)}
          title="Delete this skill?"
          className="rounded-md p-1 text-[#9CA3AF] transition-colors hover:bg-red-50 hover:text-[#DC2626]"
        />
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex flex-col gap-1.5 justify-center">
          <Label className="text-[12px] text-[#6B7280]">Skill Name</Label>
          <Input
            value={form.skillName}
            onChange={(e) => update({ skillName: formatTitleCase(e.target.value) })}
            disabled={disabled}
            className={cn("h-9", skillEmpty ? "border-red-400 focus-visible:ring-red-400" : "")}
          />
        </div>
      </div>
    </div>
  );
}

const emptyForm: SkillInput = {
  skillName: "",
};
function SkillForm({
  resumeId,
  onDone,
  onPersisted,
  onDirtyChange,
  onFormChange,
}: {
  resumeId: string;
  onDone: () => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
  onFormChange?: (draft: SkillInput | null) => void;
}) {
  const [form, setForm] = useState<SkillInput>(emptyForm);
  const [pending, startTransition] = useTransition();
  const [showValidation, setShowValidation] = useState(false);

  const skillEmpty = showValidation && !form.skillName.trim();

  function handleSubmit() {
    if (!form.skillName.trim()) {
      setShowValidation(true);
      toast.error("Please fill in the skill name.");
      return;
    }
    startTransition(async () => {
      try {
        await saveSkill(resumeId, form);
        toast.success("Skill saved.");
        setForm(emptyForm);
        onPersisted?.();
        onDirtyChange?.(false, () => {});
        onDone();
      } catch {
        toast.error("Could not save.");
      }
    });
  }

  useEffect(() => {
    const isDirty = !!form.skillName.trim();
    onDirtyChange?.(isDirty, handleSubmit);
    onFormChange?.(form);
  }, [form, onFormChange]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sk-name">Skill name <span className="text-red-500">*</span></Label>
        <Input 
          id="sk-name" 
          value={form.skillName} 
          onChange={(e) => setForm((f) => ({ ...f, skillName: formatTitleCase(e.target.value) }))} 
          className={skillEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
        />
      </div>
      {/* Internal Save button removed in favor of global header button */}
    </div>
  );
}

export function SkillsSection({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled = false,
  headerActions,
  onAddingChange,
  onNewDraftChange,
  onActivateEdit,
  isAdding,
}: {
  resumeId: string;
  initial: Skill[];
  onItemsChange?: (items: Skill[]) => void;
  onPersisted?: () => void;
  disabled?: boolean;
  headerActions?: React.ReactNode;
  onAddingChange?: (isAdding: boolean) => void;
  onNewDraftChange?: (draft: any | null) => void;
  onActivateEdit?: () => void;
  isAdding?: boolean;
}) {
  const {
    items,
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
    localDirty,
    activeSave,
  } = useGenericSection({
    resumeId,
    tableName: "Skills",
    initial,
    onItemsChange,
    onPersisted,
    removeAction: removeSkill,
    reorderAction: reorderSkillsAction,
    headerActions,
    onAddingChange,
    isAdding,
  });

  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    // If user clicks ADD while already open with content, trigger auto-save but stay open
    if (isOpen && open && localDirty && activeSave) {
      setIsAutoSaving(true);
      activeSave();
      return;
    }

    setOpen(isOpen);
    if (!isOpen) onNewDraftChange?.(null);
  };

  return (
    <SectionShell
      title="Skills"
      addLabel="Add"
      open={open}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      headerActions={hijackedActions}
      onActivateEdit={onActivateEdit}
      form={
        <SkillForm
          key="new"
          resumeId={resumeId}
          onDone={() => {
            if (isAutoSaving) {
              setIsAutoSaving(false);
              // Form is already reset internally by SkillForm
              return;
            }
            handleOpenChange(false);
          }}
          onPersisted={onPersisted}
          onDirtyChange={(isDirty, saveFn) => {
            setLocalDirty(isDirty);
            setActiveSave(() => saveFn);
          }}
          onFormChange={onNewDraftChange}
        />
      }
    >
      <DndContext id={`skills-${resumeId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {items.map((item) => (
              <SkillCard
                key={item.id}
                item={item}
                resumeId={resumeId}
                onDelete={handleDelete}
                onToggleVisibility={handleToggleVisibility}
                onDraftChange={handleDraftChange}
                onPersisted={onPersisted}
                onDirtyChange={(isDirty, saveFn) => {
                  setLocalDirty(isDirty);
                  setActiveSave(() => saveFn);
                }}
                disabled={disabled || pending}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </SectionShell>
  );
}
