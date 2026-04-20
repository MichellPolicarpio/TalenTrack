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
  saveAchievement,
  removeAchievement,
  reorderAchievementsAction,
  toggleVisibilityAction,
} from "@/lib/actions/sections.actions";
import type { Achievement, AchievementInput } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionShell } from "./SectionShell";
import { useGenericSection } from "@/lib/hooks/useGenericSection";

function AchievementCard({
  item,
  resumeId,
  onDelete,
  onToggleVisibility,
  onDraftChange,
  onPersisted,
  onDirtyChange,
  disabled,
}: {
  item: Achievement;
  resumeId: string;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDraftChange: (id: string, patch: Partial<Achievement>) => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const initial: AchievementInput = {
    id: item.id,
    year: item.year,
    title: item.title,
    organization: item.organization,
    description: item.description,
  };

  const [baseline, setBaseline] = useState<AchievementInput>(initial);
  const [form, setForm] = useState<AchievementInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();

  function update(patch: Partial<AchievementInput>) {
    const nextForm = { ...form, ...patch };
    setForm(nextForm);
    
    // Create a precise draft patch to avoid undefined values in drafted state
    const draftPatch: Partial<Achievement> = {};
    if (patch.year !== undefined) draftPatch.year = patch.year;
    if (patch.title !== undefined) draftPatch.title = patch.title;
    if (patch.organization !== undefined) draftPatch.organization = patch.organization;
    if (patch.description !== undefined) draftPatch.description = patch.description;

    onDraftChange(item.id, draftPatch);
    
    if (!dirty) {
      setDirty(true);
      const isValid = !!nextForm.title.trim();
      onDirtyChange?.(true, () => {
        if (isValid) handleSave();
        else toast.error("Please fill the Title.");
      });
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
        await saveAchievement(resumeId, form);
        toast.success("Achievement saved.");
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
      year: baseline.year,
      title: baseline.title,
      organization: baseline.organization,
      description: baseline.description,
    });
    setDirty(false);
    onDirtyChange?.(false, () => {});
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-md sm:gap-4 sm:p-5",
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
          className="cursor-grab rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[12px] text-[#6B7280]">Title *</Label>
            <span className="text-[11px] text-[#9CA3AF] tabular-nums">{form.title.length}/200</span>
          </div>
          <Input
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            disabled={disabled}
            className="text-[11pt] font-semibold"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <Label className="text-[12px] text-[#6B7280]">Organization</Label>
            <Input
              value={form.organization ?? ""}
              onChange={(e) => update({ organization: e.target.value || null })}
              disabled={disabled}
              placeholder="e.g. University"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <Label className="text-[12px] text-[#6B7280]">Year</Label>
            <Input
              type="number"
              min={1950}
              max={2099}
              value={form.year ?? ""}
              onChange={(e) => update({ year: e.target.value ? Number(e.target.value) : null })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Description</Label>
          <Textarea
            rows={2}
            value={form.description ?? ""}
            onChange={(e) => update({ description: e.target.value || null })}
            disabled={disabled}
            className="text-[10pt]"
          />
        </div>
      </div>
    </div>
  );
}

const emptyForm: AchievementInput = {
  year: null,
  title: "",
  organization: null,
  description: null,
};

function AchievementForm({
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
  const [form, setForm] = useState<AchievementInput>(emptyForm);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      try {
        await saveAchievement(resumeId, form);
        toast.success("Achievement saved.");
        onPersisted?.();
        onDirtyChange?.(false, () => {});
        onDone();
      } catch {
        toast.error("Could not save.");
      }
    });
  }

  useEffect(() => {
    const isDirty = !!form.title.trim() || !!form.year || !!form.organization || !!form.description;
    const isValid = !!form.title.trim();
    onDirtyChange?.(isDirty, () => {
      if (isValid) handleSubmit();
      else toast.error("Title is required.");
    });
  }, [form]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ach-title">Title *</Label>
        <Input 
          id="ach-title" 
          value={form.title} 
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} 
          placeholder="e.g. Employee of the Year"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2 md:col-span-3">
          <Label htmlFor="ach-org">Organization</Label>
          <Input id="ach-org" value={form.organization ?? ""} onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value || null }))} placeholder="e.g. Acme Corp" />
        </div>
        <div className="flex flex-col gap-2 md:col-span-1">
          <Label htmlFor="ach-year">Year</Label>
          <Input id="ach-year" type="number" min={1950} max={2099} value={form.year ?? ""} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : null }))} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ach-desc">Description</Label>
        <Textarea id="ach-desc" rows={2} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))} placeholder="Describe your achievement..." />
      </div>
    </div>
  );
}

export function AchievementsSection({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled = false,
  headerActions,
}: {
  resumeId: string;
  initial: Achievement[];
  onItemsChange?: (items: Achievement[]) => void;
  onPersisted?: () => void;
  disabled?: boolean;
  headerActions?: React.ReactNode;
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
  } = useGenericSection({
    resumeId,
    tableName: "Achievements",
    initial,
    onItemsChange,
    onPersisted,
    removeAction: removeAchievement,
    reorderAction: reorderAchievementsAction,
    headerActions,
  });

  return (
    <SectionShell
      title="Achievements"
      addLabel="Add"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      headerActions={hijackedActions}
      form={
        <AchievementForm
          key="new"
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
      <DndContext id={`achievements-${resumeId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {items.map((item) => (
              <AchievementCard
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
