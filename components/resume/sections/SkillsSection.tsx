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
import { cn } from "@/lib/utils";
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
    startSave(async () => {
      try {
        await saveSkill(resumeId, form);
        toast.success("Skill saved.");
        setBaseline(form);
        setDirty(false);
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
        "group relative flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-md",
        isDragging && "z-50 opacity-50",
      )}
    >
      <div className="flex shrink-0 flex-col items-center justify-center gap-3 border-r border-neutral-100 pr-4">
        <button
          type="button"
          disabled={disabled}
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
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDelete(item.id)}
          className="rounded-md p-1 text-[#9CA3AF] transition-colors hover:bg-red-50 hover:text-[#DC2626]"
        >
          <Trash2 className="size-[15px]" />
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-neutral-400 transition-colors hover:text-neutral-600 focus:outline-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Skill Name</Label>
          <Input
            value={form.skillName}
            onChange={(e) => update({ skillName: e.target.value })}
            disabled={disabled}
          />
        </div>
        {dirty && !disabled && (
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="gap-1.5"
            >
              <X className="size-3.5" />
              Cancel
            </Button>
          </div>
        )}
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
}: {
  resumeId: string;
  onDone: () => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
}) {
  const [form, setForm] = useState<SkillInput>(emptyForm);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
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
  }, [form]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sk-name">Skill name *</Label>
        <Input id="sk-name" value={form.skillName} onChange={(e) => setForm((f) => ({ ...f, skillName: e.target.value }))} />
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
}: {
  resumeId: string;
  initial: Skill[];
  onItemsChange?: (items: Skill[]) => void;
  onPersisted?: () => void;
  disabled?: boolean;
  headerActions?: React.ReactNode;
}) {
  const [items, setItems] = useState(initial);
  
  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor));

  const [localDirty, setLocalDirty] = useState(false);
  const [activeSave, setActiveSave] = useState<(() => void) | null>(null);

  const hijackedActions = React.useMemo(() => {
    if (!React.isValidElement(headerActions)) return headerActions;
    return React.cloneElement(headerActions as React.ReactElement<any>, {
      onSave: localDirty && activeSave ? activeSave : (headerActions.props as any).onSave,
      hasUnsavedChanges: localDirty || (headerActions.props as any).hasUnsavedChanges,
    });
  }, [headerActions, localDirty, activeSave]);

  function updateItems(updater: (prev: Skill[]) => Skill[]) {
    setItems((prev) => {
      const next = updater(prev);
      if (onItemsChange) setTimeout(() => onItemsChange(next), 0);
      return next;
    });
  }

  function handleDraftChange(id: string, patch: Partial<Skill>) {
    updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function handleToggleVisibility(id: string, visible: boolean) {
    updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, isVisibleOnResume: visible } : i)));
    startTransition(async () => {
      try {
        await toggleVisibilityAction(resumeId, "Skills", id, visible);
        onPersisted?.();
      } catch {
        updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, isVisibleOnResume: !visible } : i)));
        toast.error("Could not update visibility.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await removeSkill(resumeId, id);
        updateItems((prev) => prev.filter((i) => i.id !== id));
        toast.success("Skill deleted.");
        onPersisted?.();
      } catch {
        toast.error("Could not delete.");
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const reordered = arrayMove(
      items,
      items.findIndex((i) => i.id === active.id),
      items.findIndex((i) => i.id === over.id),
    ).map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    updateItems(() => reordered);
    startTransition(async () => {
      try {
        await reorderSkillsAction(resumeId, reordered.map((i) => ({ id: i.id, sortOrder: i.sortOrder })));
        onPersisted?.();
      } catch {
        toast.error("Could not save order.");
      }
    });
  }

  return (
    <SectionShell
      title="Technical Mastery"
      addLabel="Add"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      headerActions={hijackedActions}
      form={
        <SkillForm
          resumeId={resumeId}
          onDone={() => setOpen(false)}
          onPersisted={onPersisted}
          onDirtyChange={(isDirty, saveFn) => {
            setLocalDirty(isDirty);
            setActiveSave(() => saveFn);
          }}
        />
      }
    >
      <DndContext id={`skills-${resumeId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {items.length === 0 ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => { if (!disabled) setOpen(true); }}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-transparent text-[13px] font-medium text-neutral-500 transition-colors hover:border-[#F17A28]/50 hover:text-[#F17A28] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" />
                Add New Entry
              </button>
            ) : (
              items.map((item) => (
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
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </SectionShell>
  );
}
