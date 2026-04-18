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
  saveResumeProject,
  removeResumeProject,
  reorderResumeProjectsAction,
  toggleVisibilityAction,
} from "@/lib/actions/sections.actions";
import type { ResumeProject, ResumeProjectInput } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionShell } from "./SectionShell";

function projectHeaderPreview(p: ResumeProject): string {
  return [p.projectName, p.clientName, p.roleTitle, p.projectValue]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" | ");
}

function ProjectCard({
  item,
  resumeId,
  onDelete,
  onToggleVisibility,
  onDraftChange,
  onPersisted,
  onDirtyChange,
  disabled,
}: {
  item: ResumeProject;
  resumeId: string;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDraftChange: (id: string, patch: Partial<ResumeProject>) => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const initial: ResumeProjectInput = {
    id: item.id,
    projectName: item.projectName,
    clientName: item.clientName,
    roleTitle: item.roleTitle,
    projectValue: item.projectValue,
    description: item.description,
  };

  const [baseline, setBaseline] = useState<ResumeProjectInput>(initial);
  const [form, setForm] = useState<ResumeProjectInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();

  function update(patch: Partial<ResumeProjectInput>) {
    const nextForm = { ...form, ...patch };
    setForm(nextForm);
    
    // Map back to ResumeProject partial
    const draftPatch: Partial<ResumeProject> = {};
    if (patch.projectName !== undefined) draftPatch.projectName = patch.projectName;
    if (patch.clientName !== undefined) draftPatch.clientName = patch.clientName;
    if (patch.roleTitle !== undefined) draftPatch.roleTitle = patch.roleTitle;
    if (patch.projectValue !== undefined) draftPatch.projectValue = patch.projectValue;
    if (patch.description !== undefined) draftPatch.description = patch.description;

    onDraftChange(item.id, draftPatch);
    if (!dirty) {
      setDirty(true);
      onDirtyChange?.(true, handleSave);
    }
  }

  // Handle baseline changes for the Save button state
  useEffect(() => {
    if (dirty) {
      onDirtyChange?.(true, handleSave);
    }
  }, [form, dirty]);

  function handleSave() {
    startSave(async () => {
      try {
        const updated = await saveResumeProject(resumeId, form);
        toast.success("Project saved.");
        setBaseline(form);
        setDirty(false);
        // Important: update the local list immediately with the fresh data from server
        onDraftChange(item.id, updated);
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
      projectName: baseline.projectName,
      clientName: baseline.clientName,
      roleTitle: baseline.roleTitle,
      projectValue: baseline.projectValue,
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

        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Project name</Label>
          <Input
            value={form.projectName}
            onChange={(e) => update({ projectName: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Client</Label>
            <Input
              value={form.clientName ?? ""}
              onChange={(e) => update({ clientName: e.target.value || null })}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Job Title / Role</Label>
            <Input
              value={form.roleTitle ?? ""}
              onChange={(e) => update({ roleTitle: e.target.value || null })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Value (optional)</Label>
          <Input
            value={form.projectValue ?? ""}
            onChange={(e) => update({ projectValue: e.target.value || null })}
            disabled={disabled}
            placeholder="e.g. $18,500 MDD"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Description</Label>
          <Textarea
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => update({ description: e.target.value || null })}
            disabled={disabled}
            placeholder="Brief summary (about 2–3 lines on the resume)"
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

const emptyForm: ResumeProjectInput = {
  projectName: "",
  clientName: null,
  roleTitle: null,
  projectValue: null,
  description: null,
};

function ProjectForm({
  resumeId,
  onDone,
  onPersisted,
  onAdded,
  onDirtyChange,
}: {
  resumeId: string;
  onDone: () => void;
  onPersisted?: () => void;
  onAdded?: (item: ResumeProject) => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
}) {
  const [form, setForm] = useState<ResumeProjectInput>(emptyForm);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      try {
        const newItem = await saveResumeProject(resumeId, form);
        toast.success("Project saved.");
        
        // Callback to parent to add the item to local state before refresh
        onAdded?.(newItem);
        
        onPersisted?.();
        onDirtyChange?.(false, () => {});
        onDone();
      } catch {
        toast.error("Could not save.");
      }
    });
  }

  useEffect(() => {
    const isDirty = !!form.projectName.trim();
    onDirtyChange?.(isDirty, handleSubmit);
  }, [form]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="rp-name">Project name *</Label>
        <Input
          id="rp-name"
          value={form.projectName}
          onChange={(e) =>
            setForm((f) => ({ ...f, projectName: e.target.value }))
          }
          placeholder="e.g. Dos Bocas New Refinery"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rp-client">Client</Label>
          <Input
            id="rp-client"
            value={form.clientName ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                clientName: e.target.value || null,
              }))
            }
            placeholder="e.g. Pemex"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rp-role">Job title / role</Label>
          <Input
            id="rp-role"
            value={form.roleTitle ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                roleTitle: e.target.value || null,
              }))
            }
            placeholder="e.g. Mechanical Supervisor"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rp-value">Value (optional)</Label>
        <Input
          id="rp-value"
          value={form.projectValue ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              projectValue: e.target.value || null,
            }))
          }
          placeholder="e.g. $18,500 MDD"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rp-desc">Description</Label>
        <Textarea
          id="rp-desc"
          rows={3}
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              description: e.target.value || null,
            }))
          }
          placeholder="Brief summary (about 2–3 lines on the resume)"
        />
      </div>
      {/* Internal Save button removed in favor of global header button */}
    </div>
  );
}

export function ProjectsSection({
  resumeId,
  initial,
  onItemsChange,
  onPersisted,
  disabled = false,
  headerActions,
}: {
  resumeId: string;
  initial: ResumeProject[];
  onItemsChange?: (items: ResumeProject[]) => void;
  onPersisted?: () => void;
  disabled?: boolean;
  headerActions?: React.ReactNode;
}) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor));

  const [localDirty, setLocalDirty] = useState(false);
  const [activeSave, setActiveSave] = useState<(() => void) | null>(null);

  const hijackedActions = React.useMemo(() => {
    if (!React.isValidElement(headerActions)) return headerActions;
    
    // If we have a local save handler, we use it. 
    // Otherwise we fall back to the global one but keep the dirty state if needed.
    return React.cloneElement(headerActions as React.ReactElement<any>, {
      onSave: localDirty && activeSave ? activeSave : (headerActions.props as any).onSave,
      hasUnsavedChanges: localDirty || (headerActions.props as any).hasUnsavedChanges,
    });
  }, [headerActions, localDirty, activeSave]);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  function updateItems(updater: (prev: ResumeProject[]) => ResumeProject[]) {
    setItems((prev) => {
      const next = updater(prev);
      if (onItemsChange) setTimeout(() => onItemsChange(next), 0);
      return next;
    });
  }

  function handleDraftChange(id: string, patch: Partial<ResumeProject>) {
    updateItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  }

  function handleToggleVisibility(id: string, visible: boolean) {
    updateItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, isVisibleOnResume: visible } : i,
      ),
    );
    startTransition(async () => {
      try {
        await toggleVisibilityAction(
          resumeId,
          "ResumeProjects",
          id,
          visible,
        );
        onPersisted?.();
      } catch {
        updateItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, isVisibleOnResume: !visible } : i,
          ),
        );
        toast.error("Could not update visibility.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await removeResumeProject(resumeId, id);
        updateItems((prev) => prev.filter((i) => i.id !== id));
        toast.success("Project deleted.");
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
        await reorderResumeProjectsAction(
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
      title="Projects"
      addLabel="Add"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      headerActions={hijackedActions}
      form={
        <ProjectForm
          key="new"
          resumeId={resumeId}
          onDone={() => setOpen(false)}
          onPersisted={onPersisted}
          onAdded={(newItem) => {
            updateItems((prev) => [...prev, newItem]);
          }}
          onDirtyChange={(isDirty, saveFn) => {
            setLocalDirty(isDirty);
            setActiveSave(() => saveFn);
          }}
        />
      }
    >
      <DndContext
        id={`resume-projects-${resumeId}`}
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
                onClick={() => {
                  if (!disabled) setOpen(true);
                }}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-transparent text-[13px] font-medium text-neutral-500 transition-colors hover:border-[#F17A28]/50 hover:text-[#F17A28] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" />
                Add New Project
              </button>
            ) : (
              items.map((item) => (
                <ProjectCard
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
