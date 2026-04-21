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
import { useGenericSection } from "@/lib/hooks/useGenericSection";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { DeleteConfirmPopover } from "./DeleteConfirmPopover";

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
  const [showValidation, setShowValidation] = useState(false);

  const companyEmpty = showValidation && !form.companyName.trim();
  const jobTitleEmpty = showValidation && !form.jobTitle.trim();
  const startDateEmpty = showValidation && !form.startDate;
  const descriptionEmpty = showValidation && !form.description?.trim();

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
    if (!form.companyName.trim() || !form.jobTitle.trim() || !form.startDate || !form.description?.trim()) {
      setShowValidation(true);
      toast.error("Please fill in all required fields.");
      return;
    }

    startSave(async () => {
      try {
        await saveWorkExperience(resumeId, form);
        toast.success("Work experience saved.");
        setBaseline(form);
        setDirty(false);
        setShowValidation(false);
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
        <DeleteConfirmPopover
          disabled={disabled}
          onConfirm={() => onDelete(item.id)}
          title="Delete this work experience?"
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
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">
              Company <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.companyName}
              onChange={(e) => update({ companyName: e.target.value })}
              disabled={disabled}
              className={companyEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.jobTitle}
              onChange={(e) => update({ jobTitle: e.target.value })}
              disabled={disabled}
              className={jobTitleEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
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
            <Label className="text-[12px] text-[#6B7280]">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <MonthYearPicker
              value={form.startDate}
              onChange={(v) => update({ startDate: v })}
              disabled={disabled}
              className={startDateEmpty ? "border-red-400" : ""}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">End Date</Label>
            <MonthYearPicker
              value={form.endDate}
              onChange={(v) => update({ endDate: v })}
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
          <Label className="text-[12px] text-[#6B7280]">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => update({ description: e.target.value || null })}
            disabled={disabled}
            className={cn(
              "min-h-[100px]",
              descriptionEmpty ? "border-red-400 focus-visible:ring-red-400" : ""
            )}
          />
        </div>
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
  const [showValidation, setShowValidation] = useState(false);

  const companyEmpty = showValidation && !form.companyName.trim();
  const jobTitleEmpty = showValidation && !form.jobTitle.trim();

  function handleSubmit() {
    if (!form.companyName.trim() || !form.jobTitle.trim()) {
      setShowValidation(true);
      toast.error("Please fill in all required fields.");
      return;
    }

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
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="we-company">Company <span className="text-red-500">*</span></Label>
        <Input 
          id="we-company" 
          value={form.companyName} 
          onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} 
          className={companyEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="we-title">Job title <span className="text-red-500">*</span></Label>
        <Input 
          id="we-title" 
          value={form.jobTitle} 
          onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} 
          className={jobTitleEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="we-location">Location</Label>
        <Input id="we-location" value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value || null }))} />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="we-start">Start date</Label>
          <MonthYearPicker
            value={form.startDate}
            onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="we-end">End date</Label>
          <MonthYearPicker
            value={form.endDate}
            disabled={form.isCurrent}
            onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="we-current" checked={form.isCurrent} onCheckedChange={(v) => setForm((f) => ({ ...f, isCurrent: Boolean(v), endDate: v ? null : f.endDate }))} />
        <Label htmlFor="we-current" className="font-normal text-sm">I currently work here</Label>
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
    tableName: "WorkExperiences",
    initial,
    onItemsChange,
    onPersisted,
    removeAction: removeWorkExperience,
    reorderAction: reorderWorkExperiencesAction,
    headerActions,
  });

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
            {items.map((item) => (
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
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </SectionShell>
  );
}
