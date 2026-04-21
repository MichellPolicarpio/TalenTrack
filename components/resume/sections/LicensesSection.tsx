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
import { GripVertical, Trash2, Loader2, Eye, EyeOff, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  saveLicense,
  removeLicense,
  reorderLicensesAction,
  toggleVisibilityAction,
} from "@/lib/actions/sections.actions";
import type { License, LicenseInput, LicenseStatus } from "@/lib/db/types";
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
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmPopover } from "./DeleteConfirmPopover";

const LICENSE_TYPES = ["PE", "SE", "EIT/EI", "Other"];
const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

function toDateStr(d: Date | null): string | null {
  return d ? (new Date(d).toISOString().split("T")[0] ?? null) : null;
}

function getStatus(isRetired: boolean, expDateStr: string | null): LicenseStatus {
  if (isRetired) return "Retired";
  if (!expDateStr) return "Active";
  const expDate = new Date(expDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expDate < today ? "Inactive" : "Active";
}

function StatusBadge({ status }: { status: LicenseStatus }) {
  const styles = {
    Active: "bg-green-100 text-green-700 border-green-200",
    Inactive: "bg-red-100 text-red-700 border-red-200",
    Retired: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <Badge variant="outline" className={`${styles[status]} font-medium uppercase text-[10px]`}>
      {status}
    </Badge>
  );
}

function LicenseCard({
  item,
  resumeId,
  onDelete,
  onToggleVisibility,
  onDraftChange,
  onPersisted,
  onDirtyChange,
  disabled,
}: {
  item: License;
  resumeId: string;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDraftChange: (id: string, patch: Partial<License>) => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const initial: LicenseInput = {
    id: item.id,
    licenseType: item.licenseType,
    jurisdiction: item.jurisdiction,
    licenseNumber: item.licenseNumber,
    expirationDate: toDateStr(item.expirationDate),
    isRetired: item.isRetired,
  };

  const [form, setForm] = useState<LicenseInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();
  const [showValidation, setShowValidation] = useState(false);

  const typeEmpty = showValidation && !form.licenseType;
  const jurisdictionEmpty = showValidation && !form.jurisdiction;
  const numberEmpty = showValidation && !form.licenseNumber?.trim();
  const expirationEmpty = showValidation && !form.isRetired && !form.expirationDate;

  const currentStatus = getStatus(form.isRetired, form.expirationDate);

  function update(patch: Partial<LicenseInput>) {
    const nextForm = { ...form, ...patch };
    setForm(nextForm);

    const draftPatch: Partial<License> = {};
    if (patch.licenseType !== undefined) draftPatch.licenseType = patch.licenseType;
    if (patch.jurisdiction !== undefined) draftPatch.jurisdiction = patch.jurisdiction;
    if (patch.licenseNumber !== undefined) draftPatch.licenseNumber = patch.licenseNumber;
    if (patch.expirationDate !== undefined) draftPatch.expirationDate = patch.expirationDate ? new Date(patch.expirationDate) : null;
    if (patch.isRetired !== undefined) draftPatch.isRetired = patch.isRetired;

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
    const isValid = !!form.licenseType && !!form.jurisdiction && !!form.licenseNumber?.trim() && (form.isRetired || !!form.expirationDate);
    if (!isValid) {
      setShowValidation(true);
      toast.error("Please fill in all required fields.");
      return;
    }

    startSave(async () => {
      try {
        await saveLicense(resumeId, form);
        toast.success("License saved.");
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
      licenseType: initial.licenseType,
      jurisdiction: initial.jurisdiction,
      licenseNumber: initial.licenseNumber,
      expirationDate: initial.expirationDate ? new Date(initial.expirationDate) : null,
      isRetired: initial.isRetired,
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
      <div className="absolute top-5 right-5">
        <StatusBadge status={currentStatus} />
      </div>

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
          title="Delete this license?"
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

      <div className="flex-1 space-y-3 pr-16 sm:pr-20">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">
              License Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.licenseType || ""}
              onValueChange={(v) => update({ licenseType: v || "" })}
              disabled={disabled}
            >
              <SelectTrigger className={typeEmpty ? "border-red-400" : ""}>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">
              Jurisdiction/State <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.jurisdiction || ""}
              onValueChange={(v) => update({ jurisdiction: v || "" })}
              disabled={disabled}
            >
              <SelectTrigger className={jurisdictionEmpty ? "border-red-400" : ""}>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 items-end sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            <Label className="text-[12px] text-[#6B7280]">
              License Number <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.licenseNumber ?? ""}
              onChange={(e) => update({ licenseNumber: e.target.value || null })}
              placeholder="e.g. 123456"
              disabled={disabled}
              className={cn("h-9", numberEmpty ? "border-red-400 focus-visible:ring-red-400" : "")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <Label className="text-[12px] text-[#6B7280]">
                Expiration Date {!form.isRetired && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type="date"
                value={form.expirationDate || ""}
                onChange={(e) => update({ expirationDate: e.target.value || null })}
                disabled={disabled || form.isRetired}
                className={cn("h-9", expirationEmpty ? "border-red-400" : "")}
              />
            </div>
            <div className="flex items-center gap-2 pb-1 sm:pb-2">
              <Checkbox
                id={`retired-${item.id}`}
                checked={form.isRetired}
                onCheckedChange={(checked) => update({ isRetired: Boolean(checked) })}
                disabled={disabled}
              />
              <Label htmlFor={`retired-${item.id}`} className="text-[13px] font-medium cursor-pointer whitespace-nowrap">Retired</Label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const emptyForm: LicenseInput = {
  licenseType: "",
  jurisdiction: "",
  licenseNumber: null,
  expirationDate: null,
  isRetired: false,
};

function LicenseForm({
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
  onFormChange?: (form: LicenseInput) => void;
}) {
  const [form, setForm] = useState<LicenseInput>(emptyForm);
  const [pending, startTransition] = useTransition();
  const [showValidation, setShowValidation] = useState(false);

  const typeEmpty = showValidation && !form.licenseType;
  const jurisdictionEmpty = showValidation && !form.jurisdiction;
  const expirationEmpty = showValidation && !form.isRetired && !form.expirationDate;

  const currentStatus = getStatus(form.isRetired, form.expirationDate);

  function handleSubmit() {
    const isValid = !!form.licenseType && !!form.jurisdiction && (form.isRetired || !!form.expirationDate);
    if (!isValid) {
      setShowValidation(true);
      toast.error("Please fill in all required fields.");
      return;
    }
    startTransition(async () => {
      try {
        await saveLicense(resumeId, form);
        toast.success("License saved.");
        onPersisted?.();
        onDirtyChange?.(false, () => {});
        onDone();
      } catch {
        toast.error("Could not save.");
      }
    });
  }

  useEffect(() => {
    const isDirty = !!form.licenseType && !!form.jurisdiction;
    onDirtyChange?.(isDirty, handleSubmit);
  }, [form]);

  useEffect(() => {
    onFormChange?.(form);
  }, [form, onFormChange]);

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 pr-16 shadow-sm sm:gap-4 sm:p-5 sm:pr-24">
      <div className="absolute top-5 right-5">
        <StatusBadge status={currentStatus} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>License Type <span className="text-red-500">*</span></Label>
          <Select value={form.licenseType} onValueChange={(v) => setForm((f) => ({ ...f, licenseType: v || "" }))}>
            <SelectTrigger className={typeEmpty ? "border-red-400" : ""}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {LICENSE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Jurisdiction <span className="text-red-500">*</span></Label>
          <Select value={form.jurisdiction} onValueChange={(v) => setForm((f) => ({ ...f, jurisdiction: v || "" }))}>
            <SelectTrigger className={jurisdictionEmpty ? "border-red-400" : ""}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lic-num">License Number</Label>
          <Input id="lic-num" value={form.licenseNumber ?? ""} onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value || null }))} placeholder="e.g. 123456" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lic-exp">Expiration Date {!form.isRetired && <span className="text-red-500">*</span>}</Label>
            <Input 
              id="lic-exp" 
              type="date" 
              value={form.expirationDate || ""} 
              onChange={(e) => setForm((f) => ({ ...f, expirationDate: e.target.value || null }))} 
              disabled={form.isRetired} 
              className={expirationEmpty ? "border-red-400" : ""}
            />
          </div>
          <div className="flex items-center gap-2 pb-1 sm:pb-2">
            <Checkbox id="lic-retired" checked={form.isRetired} onCheckedChange={(checked) => setForm((f) => ({ ...f, isRetired: Boolean(checked) }))} />
            <Label htmlFor="lic-retired" className="text-[13px] font-medium cursor-pointer whitespace-nowrap">Retired</Label>
          </div>
        </div>
      </div>
      {/* Internal Save button removed in favor of global header button */}
    </div>
  );
}

export function LicensesSection({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled = false,
  headerActions,
  onAddingChange,
  onNewDraftChange,
}: {
  resumeId: string;
  initial: License[];
  onItemsChange?: (items: License[]) => void;
  onPersisted?: () => void;
  disabled?: boolean;
  headerActions?: React.ReactNode;
  onAddingChange?: (isAdding: boolean) => void;
  onNewDraftChange?: (draft: LicenseInput | null) => void;
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
    tableName: "Licenses",
    initial,
    onItemsChange,
    onPersisted,
    removeAction: removeLicense,
    reorderAction: reorderLicensesAction,
    headerActions,
    onAddingChange,
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) onNewDraftChange?.(null);
  };

  return (
    <SectionShell
      title="Licenses"
      addLabel="Add"
      open={open}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      headerActions={hijackedActions}
      form={
        <LicenseForm
          key="new"
          resumeId={resumeId}
          onDone={() => handleOpenChange(false)}
          onPersisted={onPersisted}
          onDirtyChange={(isDirty, saveFn) => {
            setLocalDirty(isDirty);
            setActiveSave(() => saveFn);
          }}
          onFormChange={onNewDraftChange}
        />
      }
    >
      <DndContext id={`licenses-${resumeId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {items.map((item) => (
              <LicenseCard
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
