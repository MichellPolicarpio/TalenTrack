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
  saveWorkExperience,
  removeWorkExperience,
  reorderWorkExperiencesAction,
  toggleVisibilityAction,
} from "@/lib/actions/sections.actions";
import type { WorkExperience, WorkExperienceInput } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionShell } from "./SectionShell";

function toDateStr(d: Date | null): string | null {
  return d ? (d.toISOString().split("T")[0] ?? null) : null;
}

function WorkExperienceCard({
  item,
  resumeId,
  onDelete,
  onToggleVisibility,
  onDraftChange,
  onPersisted,
  onDirtyChange,
  disabled,
}: {
  item: WorkExperience;
  resumeId: string;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDraftChange: (id: string, patch: Partial<WorkExperience>) => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const initial: WorkExperienceInput = {
    id: item.id,
    companyName: item.companyName,
    jobTitle: item.jobTitle,
    location: item.location,
    startDate: toDateStr(item.startDate),
    endDate: toDateStr(item.endDate),
    isCurrent: item.isCurrent,
    description: item.description,
  };

  const [baseline, setBaseline] = useState<WorkExperienceInput>(initial);
  const [form, setForm] = useState<WorkExperienceInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();

  function update(patch: Partial<WorkExperienceInput>) {
    const nextForm = { ...form, ...patch };
    setForm(nextForm);
    
    // Map Input fields back to WorkExperience partial
    const draftPatch: Partial<WorkExperience> = {};
    if (patch.companyName !== undefined) draftPatch.companyName = patch.companyName;
    if (patch.jobTitle !== undefined) draftPatch.jobTitle = patch.jobTitle;
    if (patch.location !== undefined) draftPatch.location = patch.location;
    if (patch.startDate !== undefined) draftPatch.startDate = patch.startDate ? new Date(patch.startDate) : null;
    if (patch.endDate !== undefined) draftPatch.endDate = patch.endDate ? new Date(patch.endDate) : null;
    if (patch.isCurrent !== undefined) draftPatch.isCurrent = patch.isCurrent;
    if (patch.description !== undefined) draftPatch.description = patch.description;

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
        await saveWorkExperience(resumeId, form);
        toast.success("Work experience saved.");
        setBaseline(form);
        setDirty(false);
        onDirtyChange?.(false, () => {});
        onPersisted?.();
      } catch {
        toast.error("Could not save. Please try again.");
      }
    });
  }

  function handleCancel() {
    setForm(baseline);
    onDraftChange(item.id, {
      companyName: baseline.companyName,
      jobTitle: baseline.jobTitle,
      location: baseline.location,
      startDate: baseline.startDate ? new Date(baseline.startDate) : null,
      endDate: baseline.endDate ? new Date(baseline.endDate) : null,
      isCurrent: baseline.isCurrent,
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
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Company</Label>
            <Input
              value={form.companyName}
              onChange={(e) => update({ companyName: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Job Title</Label>
            <Input
              value={form.jobTitle}
              onChange={(e) => update({ jobTitle: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Location</Label>
          <Input
            value={form.location ?? ""}
            onChange={(e) => update({ location: e.target.value || null })}
            disabled={disabled}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Start Date</Label>
            <Input
              type="date"
              value={form.startDate ?? ""}
              onChange={(e) => update({ startDate: e.target.value || null })}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">End Date</Label>
            <Input
              type="date"
              value={form.endDate ?? ""}
              onChange={(e) => update({ endDate: e.target.value || null })}
              disabled={disabled || form.isCurrent}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.isCurrent}
            onCheckedChange={(v) =>
              update({ isCurrent: Boolean(v), endDate: v ? null : form.endDate })
            }
            disabled={disabled}
          />
          <Label className="text-[12px] font-normal text-[#6B7280]">
            I currently work here
          </Label>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Description</Label>
          <Textarea
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => update({ description: e.target.value || null })}
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

const emptyForm: WorkExperienceInput = {
  companyName: "",
  jobTitle: "",
  location: null,
  startDate: null,
  endDate: null,
  isCurrent: false,
  description: null,
};

function WorkExperienceForm({
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
  const [form, setForm] = useState<WorkExperienceInput>(emptyForm);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      try {
        await saveWorkExperience(resumeId, form);
        toast.success("Work experience saved.");
        onPersisted?.();
        onDirtyChange?.(false, () => {});
        onDone();
      } catch {
        toast.error("Could not save. Please try again.");
      }
    });
  }

  useEffect(() => {
    const isDirty = !!form.companyName.trim() || !!form.jobTitle.trim();
    onDirtyChange?.(isDirty, handleSubmit);
  }, [form]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="we-company">Company *</Label>
        <Input id="we-company" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="we-title">Job title *</Label>
        <Input id="we-title" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="we-location">Location</Label>
        <Input id="we-location" value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value || null }))} />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="we-start">Start date</Label>
          <Input id="we-start" type="date" value={form.startDate ?? ""} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value || null }))} />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="we-end">End date</Label>
          <Input id="we-end" type="date" value={form.endDate ?? ""} disabled={form.isCurrent} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value || null }))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="we-current" checked={form.isCurrent} onCheckedChange={(v) => setForm((f) => ({ ...f, isCurrent: Boolean(v), endDate: v ? null : f.endDate }))} />
        <Label htmlFor="we-current" className="font-normal">I currently work here</Label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="we-desc">Description</Label>
        <Textarea id="we-desc" rows={4} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))} />
      </div>
      {/* Internal Save button removed in favor of global header button */}
    </div>
  );
}

export function WorkExperienceSection({
  resumeId,
  initial,
  onItemsChange,
  /** Called after a successful server write so “last saved” can update. */
  onPersisted,
  disabled = false,
  headerActions,
}: {
  resumeId: string;
  initial: WorkExperience[];
  onItemsChange?: (items: WorkExperience[]) => void;
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

  function updateItems(updater: (prev: WorkExperience[]) => WorkExperience[]) {
    setItems((prev) => {
      const next = updater(prev);
      if (onItemsChange) setTimeout(() => onItemsChange(next), 0);
      return next;
    });
  }

  function handleDraftChange(id: string, patch: Partial<WorkExperience>) {
    updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function handleToggleVisibility(id: string, visible: boolean) {
    updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, isVisibleOnResume: visible } : i)));
    startTransition(async () => {
      try {
        await toggleVisibilityAction(resumeId, "WorkExperiences", id, visible);
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
        await removeWorkExperience(resumeId, id);
        updateItems((prev) => prev.filter((i) => i.id !== id));
        toast.success("Entry deleted.");
        onPersisted?.();
      } catch {
        toast.error("Could not delete.");
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
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
        await reorderWorkExperiencesAction(
          resumeId,
          reordered.map((i) => ({ id: i.id, sortOrder: i.sortOrder })),
        );
        onPersisted?.();
      } catch {
        toast.error("Could not save order.");
      }
    });
  }

  return (
    <SectionShell
      title="Work Experience"
      addLabel="Add"
      open={open}
      disabled={disabled}
      onOpenChange={setOpen}
      headerActions={hijackedActions}
      form={
        <WorkExperienceForm
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
      <DndContext
        id={`work-experience-${resumeId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col">
            {items.length === 0 ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => { if (!disabled) setOpen(true); }}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-transparent text-[13px] font-medium text-neutral-500 transition-colors hover:border-[#F17A28]/50 hover:text-[#F17A28] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" />
                Add New Entry
              </button>
            ) : (
              items.map((item) => (
                <WorkExperienceCard
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
