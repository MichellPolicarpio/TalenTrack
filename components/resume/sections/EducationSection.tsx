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
  saveEducation,
  removeEducation,
  reorderEducationAction,
  toggleVisibilityAction,
} from "@/lib/actions/sections.actions";
import type { Education, EducationInput } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

const DEGREE_TYPES = [
  "Associate",
  "Bachelor",
  "Master",
  "PhD",
  "Undergraduate",
  "Graduate",
  "Certificate",
  "Diploma",
  "Other",
];

function EducationCard({
  item,
  resumeId,
  onDelete,
  onToggleVisibility,
  onDraftChange,
  onPersisted,
  onDirtyChange,
  disabled,
}: {
  item: Education;
  resumeId: string;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDraftChange: (id: string, patch: Partial<Education>) => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const initial: EducationInput = {
    id: item.id,
    institutionName: item.institutionName,
    degree: item.degree,
    degreeType: item.degreeType,
    specialization: item.specialization,
    startYear: item.startYear,
    endYear: item.endYear,
    isOngoing: item.isOngoing,
  };

  const [form, setForm] = useState<EducationInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();
  const [showValidation, setShowValidation] = useState(false);

  const institutionEmpty = showValidation && !form.institutionName.trim();
  const degreeEmpty = showValidation && !form.degree.trim();
  const degreeTypeEmpty = showValidation && !form.degreeType;
  const startYearEmpty = showValidation && form.startYear === null;

  function update(patch: Partial<EducationInput>) {
    const nextForm = { ...form, ...patch };
    setForm(nextForm);

    const draftPatch: Partial<Education> = {};
    if (patch.institutionName !== undefined) draftPatch.institutionName = patch.institutionName;
    if (patch.degree !== undefined) draftPatch.degree = patch.degree;
    if (patch.degreeType !== undefined) draftPatch.degreeType = patch.degreeType;
    if (patch.specialization !== undefined) draftPatch.specialization = patch.specialization;
    if (patch.startYear !== undefined) draftPatch.startYear = patch.startYear;
    if (patch.endYear !== undefined) draftPatch.endYear = patch.endYear;
    if (patch.isOngoing !== undefined) draftPatch.isOngoing = patch.isOngoing;

    const isValid = !!nextForm.institutionName.trim() && 
                    !!nextForm.degree.trim() && 
                    !!nextForm.degreeType && 
                    nextForm.startYear !== null;

    onDraftChange(item.id, draftPatch);
    if (!dirty) {
      setDirty(true);
      onDirtyChange?.(true, () => {
        if (isValid) handleSave();
        else toast.error("Please fill all mandatory fields.");
      });
    }
  }

  useEffect(() => {
    if (dirty) {
      onDirtyChange?.(true, handleSave);
    }
  }, [form, dirty]);

  function handleSave() {
    const isValid = !!form.institutionName.trim() && 
                    !!form.degree.trim() && 
                    !!form.degreeType && 
                    form.startYear !== null;

    if (!isValid) {
      setShowValidation(true);
      toast.error("Please fill all mandatory fields.");
      return;
    }

    startSave(async () => {
      try {
        await saveEducation(resumeId, form);
        toast.success("Education saved.");
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
    setForm(initial);
    onDraftChange(item.id, {
      institutionName: initial.institutionName,
      degree: initial.degree,
      degreeType: initial.degreeType,
      specialization: initial.specialization,
      startYear: initial.startYear,
      endYear: initial.endYear,
      isOngoing: initial.isOngoing,
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
          title="Delete this education entry?"
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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[12px] text-[#6B7280]">Institution <span className="text-red-500">*</span></Label>
            <span className="text-[11px] text-[#9CA3AF] tabular-nums">{form.institutionName.length}/45</span>
          </div>
          <Input
            value={form.institutionName}
            maxLength={45}
            onChange={(e) => update({ institutionName: e.target.value.slice(0, 45) })}
            disabled={disabled}
            className={institutionEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <Label className="text-[12px] text-[#6B7280]">Level <span className="text-red-500">*</span></Label>
            <Select
              value={form.degreeType ?? ""}
              onValueChange={(v) => update({ degreeType: v })}
              disabled={disabled}
            >
              <SelectTrigger className={degreeTypeEmpty ? "border-red-400" : ""}>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {DEGREE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <Label className="text-[12px] text-[#6B7280]">Major <span className="text-red-500">*</span></Label>
            <Input
              value={form.degree}
              onChange={(e) => update({ degree: e.target.value })}
              disabled={disabled}
              placeholder="e.g. Civil Engineering"
              className={degreeEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label className="text-[12px] text-[#6B7280]">Specialization</Label>
            <Input
              value={form.specialization ?? ""}
              onChange={(e) => update({ specialization: e.target.value || null })}
              disabled={disabled}
              placeholder="e.g. AI"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <Label className="text-[12px] text-[#6B7280]">Start <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              min={1950}
              max={2099}
              value={form.startYear ?? ""}
              onChange={(e) => update({ startYear: e.target.value ? Number(e.target.value) : null })}
              disabled={disabled}
              className={cn("w-full h-9 text-[11pt]", startYearEmpty ? "border-red-400 focus-visible:ring-red-400" : "")}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <Label className="text-[12px] text-[#6B7280]">End</Label>
            <Input
              type="number"
              min={1950}
              max={2099}
              value={form.endYear ?? ""}
              onChange={(e) => update({ endYear: e.target.value ? Number(e.target.value) : null })}
              disabled={disabled || form.isOngoing}
              className="w-full h-9 text-[11pt]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={`ongoing-${item.id}`}
            checked={form.isOngoing}
            onCheckedChange={(v) =>
              update({ isOngoing: Boolean(v), endYear: v ? null : form.endYear })
            }
            disabled={disabled}
          />
          <Label htmlFor={`ongoing-${item.id}`} className="text-[12px] font-normal text-[#6B7280]">
            Currently studying here
          </Label>
        </div>
      </div>
    </div>
  );
}

const emptyForm: EducationInput = {
  institutionName: "",
  degree: "",
  degreeType: null,
  specialization: null,
  startYear: null,
  endYear: null,
  isOngoing: false,
};

function EducationForm({
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
  onFormChange?: (draft: any | null) => void;
}) {
  const [form, setForm] = useState<EducationInput>(emptyForm);
  const [pending, startTransition] = useTransition();
  const [showValidation, setShowValidation] = useState(false);

  const institutionEmpty = showValidation && !form.institutionName.trim();
  const degreeEmpty = showValidation && !form.degree.trim();
  const degreeTypeEmpty = showValidation && !form.degreeType;
  const startYearEmpty = showValidation && form.startYear === null;

  function handleSubmit() {
    const isValid = !!form.institutionName.trim() && 
                    !!form.degree.trim() && 
                    !!form.degreeType && 
                    form.startYear !== null;

    if (!isValid) {
      setShowValidation(true);
      toast.error("Please fill all mandatory fields.");
      return;
    }

    startTransition(async () => {
      try {
        await saveEducation(resumeId, form);
        toast.success("Education saved.");
        onPersisted?.();
        onDirtyChange?.(false, () => {});
        onDone();
      } catch {
        toast.error("Could not save.");
      }
    });
  }

  useEffect(() => {
    const isDirty = !!form.institutionName.trim() || !!form.degree.trim() || !!form.degreeType || form.startYear !== null;
    const isValid = !!form.institutionName.trim() && !!form.degree.trim() && !!form.degreeType && form.startYear !== null;
    onDirtyChange?.(isDirty, () => {
      if (isValid) handleSubmit();
      else toast.error("Please fill all mandatory fields.");
    });
    onFormChange?.(form);
  }, [form]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="ed-inst">Institution <span className="text-red-500">*</span></Label>
          <span className="text-[11px] text-[#9CA3AF] tabular-nums">{form.institutionName.length}/45</span>
        </div>
        <Input 
          id="ed-inst" 
          maxLength={45} 
          value={form.institutionName} 
          onChange={(e) => setForm((f) => ({ ...f, institutionName: formatTitleCase(e.target.value.slice(0, 45)) }))} 
          className={institutionEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2 md:col-span-1">
          <Label htmlFor="ed-type">Level <span className="text-red-500">*</span></Label>
          <Select
            value={form.degreeType ?? ""}
            onValueChange={(v) => setForm((f) => ({ ...f, degreeType: v }))}
          >
            <SelectTrigger id="ed-type" className={degreeTypeEmpty ? "border-red-400" : ""}>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              {DEGREE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 md:col-span-3">
          <Label htmlFor="ed-degree">Major <span className="text-red-500">*</span></Label>
          <Input 
            id="ed-degree" 
            value={form.degree} 
            onChange={(e) => setForm((f) => ({ ...f, degree: formatTitleCase(e.target.value) }))} 
            placeholder="e.g. Civil Engineering"
            className={degreeEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="ed-field">Specialization (optional)</Label>
          <Input id="ed-field" value={form.specialization ?? ""} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value ? formatTitleCase(e.target.value) : null }))} placeholder="e.g. AI" />
        </div>
        <div className="flex flex-col gap-2 md:col-span-1">
          <Label htmlFor="ed-start" className="text-neutral-500">Start <span className="text-red-500">*</span></Label>
          <Input 
            id="ed-start" 
            type="number" 
            min={1950} 
            max={2099} 
            value={form.startYear ?? ""} 
            className={cn("w-full h-9", startYearEmpty ? "border-red-400 focus-visible:ring-red-400" : "")} 
            onChange={(e) => setForm((f) => ({ ...f, startYear: e.target.value ? Number(e.target.value) : null }))} 
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-1">
          <Label htmlFor="ed-end" className="text-neutral-500">End</Label>
          <Input id="ed-end" type="number" min={1950} max={2099} value={form.endYear ?? ""} className="w-full h-9" disabled={form.isOngoing} onChange={(e) => setForm((f) => ({ ...f, endYear: e.target.value ? Number(e.target.value) : null }))} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Checkbox id="ed-ongoing" checked={form.isOngoing} onCheckedChange={(v) => setForm((f) => ({ ...f, isOngoing: Boolean(v), endYear: v ? null : f.endYear }))} />
        <Label htmlFor="ed-ongoing" className="font-normal text-[13px] text-neutral-600">Currently studying here</Label>
      </div>
    </div>
  );
}

export function EducationSection({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled = false,
  headerActions,
  onActivateEdit,
  isAdding,
  onAddingChange,
  onNewDraftChange,
}: {
  resumeId: string;
  initial: Education[];
  onItemsChange?: (items: Education[]) => void;
  onPersisted?: () => void;
  disabled?: boolean;
  headerActions?: React.ReactNode;
  onActivateEdit?: () => void;
  isAdding?: boolean;
  onAddingChange?: (isAdding: boolean) => void;
  onNewDraftChange?: (draft: any | null) => void;
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
    tableName: "Education",
    initial,
    onItemsChange,
    onPersisted,
    removeAction: removeEducation,
    reorderAction: reorderEducationAction,
    headerActions,
    isAdding,
    onAddingChange,
  });
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onAddingChange?.(isOpen);
    if (!isOpen) onNewDraftChange?.(null);
  };

  return (
    <SectionShell
      title="Education"
      addLabel="Add"
      open={open}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      headerActions={hijackedActions}
      onActivateEdit={onActivateEdit}
      form={
        <EducationForm
          key="new"
          resumeId={resumeId}
          onDone={() => setOpen(false)}
          onPersisted={onPersisted}
          onDirtyChange={(isDirty, saveFn) => {
            setLocalDirty(isDirty);
            setActiveSave(() => saveFn);
          }}
          onFormChange={onNewDraftChange}
        />
      }
    >
      <DndContext id={`education-${resumeId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {items.map((item) => (
              <EducationCard
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
