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
  saveCertification,
  removeCertification,
  reorderCertificationsAction,
  toggleVisibilityAction,
} from "@/lib/actions/sections.actions";
import type { Certification, CertificationInput } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionShell } from "./SectionShell";
import { useGenericSection } from "@/lib/hooks/useGenericSection";

function toDateStr(d: Date | null): string | null {
  return d ? (d.toISOString().split("T")[0] ?? null) : null;
}

function CertCard({
  item,
  resumeId,
  onDelete,
  onToggleVisibility,
  onDraftChange,
  onPersisted,
  onDirtyChange,
  disabled,
}: {
  item: Certification;
  resumeId: string;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDraftChange: (id: string, patch: Partial<Certification>) => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const initial: CertificationInput = {
    id: item.id,
    certificationName: item.certificationName,
    issuingOrganization: item.issuingOrganization,
    issueDate: toDateStr(item.issueDate),
    expirationDate: toDateStr(item.expirationDate),
    credentialId: item.credentialId,
  };

  const [form, setForm] = useState<CertificationInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();
  const [showValidation, setShowValidation] = useState(false);

  const nameEmpty = showValidation && !form.certificationName.trim();
  const orgEmpty = showValidation && !form.issuingOrganization?.trim();
  const dateEmpty = showValidation && !form.issueDate;

  function update(patch: Partial<CertificationInput>) {
    const nextForm = { ...form, ...patch };
    setForm(nextForm);

    const draftPatch: Partial<Certification> = {};
    if (patch.certificationName !== undefined) draftPatch.certificationName = patch.certificationName;
    if (patch.issuingOrganization !== undefined) draftPatch.issuingOrganization = patch.issuingOrganization;
    if (patch.issueDate !== undefined) draftPatch.issueDate = patch.issueDate ? new Date(patch.issueDate) : null;
    if (patch.expirationDate !== undefined) draftPatch.expirationDate = patch.expirationDate ? new Date(patch.expirationDate) : null;
    if (patch.credentialId !== undefined) draftPatch.credentialId = patch.credentialId;

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
    if (!form.certificationName.trim() || !form.issuingOrganization?.trim() || !form.issueDate) {
      setShowValidation(true);
      toast.error("Please fill in all required fields.");
      return;
    }

    startSave(async () => {
      try {
        await saveCertification(resumeId, form);
        toast.success("Certification saved.");
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
      certificationName: initial.certificationName,
      issuingOrganization: initial.issuingOrganization,
      issueDate: initial.issueDate ? new Date(initial.issueDate) : null,
      expirationDate: initial.expirationDate ? new Date(initial.expirationDate) : null,
      credentialId: initial.credentialId,
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
          <Label className="text-[12px] text-[#6B7280]">
            Certification Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.certificationName}
            onChange={(e) => update({ certificationName: e.target.value })}
            disabled={disabled}
            className={nameEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">
            Issuing Organization <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.issuingOrganization ?? ""}
            onChange={(e) => update({ issuingOrganization: e.target.value || null })}
            disabled={disabled}
            className={orgEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">
              Issue Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={form.issueDate ?? ""}
              onChange={(e) => update({ issueDate: e.target.value || null })}
              disabled={disabled}
              className={dateEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Expiration Date</Label>
            <Input
              type="date"
              value={form.expirationDate ?? ""}
              onChange={(e) => update({ expirationDate: e.target.value || null })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Certification Number or ID</Label>
          <Input
            value={form.credentialId ?? ""}
            onChange={(e) => update({ credentialId: e.target.value || null })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

const emptyForm: CertificationInput = {
  certificationName: "",
  issuingOrganization: null,
  issueDate: null,
  expirationDate: null,
  credentialId: null,
};

function CertForm({
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
  onFormChange?: (form: CertificationInput) => void;
}) {
  const [form, setForm] = useState<CertificationInput>(emptyForm);
  const [pending, startTransition] = useTransition();
  const [showValidation, setShowValidation] = useState(false);

  const nameEmpty = showValidation && !form.certificationName.trim();

  function handleSubmit() {
    if (!form.certificationName.trim()) {
      setShowValidation(true);
      toast.error("Please fill in the certification name.");
      return;
    }
    startTransition(async () => {
      try {
        await saveCertification(resumeId, form);
        toast.success("Certification saved.");
        onPersisted?.();
        onDirtyChange?.(false, () => {});
        onDone();
      } catch {
        toast.error("Could not save.");
      }
    });
  }

  useEffect(() => {
    const isDirty = !!form.certificationName.trim();
    onDirtyChange?.(isDirty, handleSubmit);
  }, [form]);

  useEffect(() => {
    onFormChange?.(form);
  }, [form, onFormChange]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cert-name">Certification name <span className="text-red-500">*</span></Label>
        <Input 
          id="cert-name" 
          value={form.certificationName} 
          onChange={(e) => setForm((f) => ({ ...f, certificationName: e.target.value }))} 
          className={nameEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cert-org">Issuing organization</Label>
        <Input id="cert-org" value={form.issuingOrganization ?? ""} onChange={(e) => setForm((f) => ({ ...f, issuingOrganization: e.target.value || null }))} />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="cert-issue">Issue date</Label>
          <Input id="cert-issue" type="date" value={form.issueDate ?? ""} onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value || null }))} />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="cert-exp">Expiration date</Label>
          <Input id="cert-exp" type="date" value={form.expirationDate ?? ""} onChange={(e) => setForm((f) => ({ ...f, expirationDate: e.target.value || null }))} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cert-id">Certification Number or ID</Label>
        <Input id="cert-id" value={form.credentialId ?? ""} onChange={(e) => setForm((f) => ({ ...f, credentialId: e.target.value || null }))} />
      </div>
      {/* Internal Save button removed in favor of global header button */}
    </div>
  );
}

export function CertificationsSection({
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
  initial: Certification[];
  onItemsChange?: (items: Certification[]) => void;
  onPersisted?: () => void;
  disabled?: boolean;
  headerActions?: React.ReactNode;
  onAddingChange?: (isAdding: boolean) => void;
  onNewDraftChange?: (draft: CertificationInput | null) => void;
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
    tableName: "Certifications",
    initial,
    onItemsChange,
    onPersisted,
    removeAction: removeCertification,
    reorderAction: reorderCertificationsAction,
    headerActions,
    onAddingChange,
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) onNewDraftChange?.(null);
  };

  return (
    <SectionShell
      title="Certifications"
      addLabel="Add"
      open={open}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      headerActions={hijackedActions}
      form={
        <CertForm
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
      <DndContext id={`certifications-${resumeId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {items.map((item) => (
              <CertCard
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
