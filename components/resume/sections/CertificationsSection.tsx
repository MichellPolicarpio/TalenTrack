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
    credentialUrl: item.credentialUrl,
  };

  const [form, setForm] = useState<CertificationInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();

  function update(patch: Partial<CertificationInput>) {
    const nextForm = { ...form, ...patch };
    setForm(nextForm);

    const draftPatch: Partial<Certification> = {};
    if (patch.certificationName !== undefined) draftPatch.certificationName = patch.certificationName;
    if (patch.issuingOrganization !== undefined) draftPatch.issuingOrganization = patch.issuingOrganization;
    if (patch.issueDate !== undefined) draftPatch.issueDate = patch.issueDate ? new Date(patch.issueDate) : null;
    if (patch.expirationDate !== undefined) draftPatch.expirationDate = patch.expirationDate ? new Date(patch.expirationDate) : null;
    if (patch.credentialId !== undefined) draftPatch.credentialId = patch.credentialId;
    if (patch.credentialUrl !== undefined) draftPatch.credentialUrl = patch.credentialUrl;

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
        await saveCertification(resumeId, form);
        toast.success("Certification saved.");
        setDirty(false);
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
      credentialUrl: initial.credentialUrl,
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
          <Label className="text-[12px] text-[#6B7280]">Certification Name</Label>
          <Input
            value={form.certificationName}
            onChange={(e) => update({ certificationName: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Issuing Organization</Label>
          <Input
            value={form.issuingOrganization ?? ""}
            onChange={(e) => update({ issuingOrganization: e.target.value || null })}
            disabled={disabled}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Issue Date</Label>
            <Input
              type="date"
              value={form.issueDate ?? ""}
              onChange={(e) => update({ issueDate: e.target.value || null })}
              disabled={disabled}
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
          <Label className="text-[12px] text-[#6B7280]">Credential ID</Label>
          <Input
            value={form.credentialId ?? ""}
            onChange={(e) => update({ credentialId: e.target.value || null })}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Credential URL</Label>
          <Input
            type="url"
            value={form.credentialUrl ?? ""}
            onChange={(e) => update({ credentialUrl: e.target.value || null })}
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

const emptyForm: CertificationInput = {
  certificationName: "",
  issuingOrganization: null,
  issueDate: null,
  expirationDate: null,
  credentialId: null,
  credentialUrl: null,
};

function CertForm({
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
  const [form, setForm] = useState<CertificationInput>(emptyForm);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cert-name">Certification name *</Label>
        <Input id="cert-name" value={form.certificationName} onChange={(e) => setForm((f) => ({ ...f, certificationName: e.target.value }))} />
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
        <Label htmlFor="cert-id">Credential ID</Label>
        <Input id="cert-id" value={form.credentialId ?? ""} onChange={(e) => setForm((f) => ({ ...f, credentialId: e.target.value || null }))} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cert-url">Credential URL</Label>
        <Input id="cert-url" type="url" value={form.credentialUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, credentialUrl: e.target.value || null }))} />
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
}: {
  resumeId: string;
  initial: Certification[];
  onItemsChange?: (items: Certification[]) => void;
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

  function updateItems(updater: (prev: Certification[]) => Certification[]) {
    setItems((prev) => {
      const next = updater(prev);
      if (onItemsChange) setTimeout(() => onItemsChange(next), 0);
      return next;
    });
  }

  function handleDraftChange(id: string, patch: Partial<Certification>) {
    updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function handleToggleVisibility(id: string, visible: boolean) {
    updateItems((prev) => prev.map((i) => (i.id === id ? { ...i, isVisibleOnResume: visible } : i)));
    startTransition(async () => {
      try {
        await toggleVisibilityAction(resumeId, "Certifications", id, visible);
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
        await removeCertification(resumeId, id);
        setItems((prev) => prev.filter((i) => i.id !== id));
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
    const reordered = arrayMove(
      items,
      items.findIndex((i) => i.id === active.id),
      items.findIndex((i) => i.id === over.id),
    ).map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    setItems(reordered);
    startTransition(async () => {
      try {
        await reorderCertificationsAction(resumeId, reordered.map((i) => ({ id: i.id, sortOrder: i.sortOrder })));
        onPersisted?.();
      } catch {
        toast.error("Could not save order.");
      }
    });
  }

  return (
    <SectionShell
      title="Certifications"
      addLabel="Add"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      headerActions={hijackedActions}
      form={
        <CertForm
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
      <DndContext id={`certifications-${resumeId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
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
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </SectionShell>
  );
}
