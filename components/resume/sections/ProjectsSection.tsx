"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  saveProject,
  removeProject,
  reorderProjectsAction,
  toggleVisibilityAction,
} from "@/lib/actions/sections.actions";
import type { Project, ProjectInput } from "@/lib/db/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionShell } from "./SectionShell";
import { useGenericSection } from "@/lib/hooks/useGenericSection";

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
  item: Project;
  resumeId: string;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDraftChange: (id: string, patch: Partial<Project>) => void;
  onPersisted?: () => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const initial: ProjectInput = {
    id: item.id,
    projectName: item.projectName,
    industry: item.industry,
    role: item.role,
    projectValue: item.projectValue,
    year: item.year,
    expandedTitle: item.expandedTitle,
    description: item.description,
  };

  const [form, setForm] = useState<ProjectInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();

  function update(patch: Partial<ProjectInput>) {
    const nextForm = { ...form, ...patch };
    setForm(nextForm);
    onDraftChange(item.id, patch as Partial<Project>);
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
        const updated = await saveProject(resumeId, form);
        toast.success("Project saved.");
        setDirty(false);
        onDraftChange(item.id, updated);
        onDirtyChange?.(false, () => {});
        onPersisted?.();
      } catch {
        toast.error("Could not save.");
      }
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-md",
        isDragging && "z-50 opacity-50",
        !item.isVisibleOnResume && "opacity-60 bg-neutral-50/50",
      )}
    >
      {/* Left controls column — identical to CertCard */}
      <div className="flex shrink-0 flex-col items-center justify-center gap-3 border-r border-neutral-100 pr-4">
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
          className="cursor-grab text-neutral-400 transition-colors hover:text-neutral-600 focus:outline-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      {/* Fields — same label/input style as CertCard */}
      <div className="flex-1 space-y-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Project Name</Label>
          <Input
            value={form.projectName}
            onChange={(e) => update({ projectName: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Industry</Label>
            <Input
              value={form.industry ?? ""}
              onChange={(e) => update({ industry: e.target.value || null })}
              disabled={disabled}
              placeholder="e.g. Oil & Gas"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Role</Label>
            <Input
              value={form.role ?? ""}
              onChange={(e) => update({ role: e.target.value || null })}
              disabled={disabled}
              placeholder="e.g. Mechanical Supervisor"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Year</Label>
            <Input
              type="number"
              value={form.year ?? ""}
              onChange={(e) => update({ year: e.target.value ? parseInt(e.target.value) : null })}
              disabled={disabled}
              placeholder="YYYY"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Project Value</Label>
            <Input
              value={form.projectValue ?? ""}
              onChange={(e) => update({ projectValue: e.target.value || null })}
              disabled={disabled}
              placeholder="e.g. $18.5B MDD"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-[#6B7280]">Expanded Title</Label>
            <Input
              value={form.expandedTitle ?? ""}
              onChange={(e) => update({ expandedTitle: e.target.value || null })}
              disabled={disabled}
              placeholder="e.g. Sub-category or scope detail"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[12px] text-[#6B7280]">Description</Label>
          <Textarea
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => update({ description: e.target.value || null })}
            disabled={disabled}
            placeholder="Brief summary of achievements..."
          />
        </div>
      </div>
    </div>
  );
}

const emptyForm: ProjectInput = {
  projectName: "",
  industry: null,
  role: null,
  projectValue: null,
  year: null,
  expandedTitle: null,
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
  onAdded?: (item: Project) => void;
  onDirtyChange?: (isDirty: boolean, saveFn: () => void) => void;
}) {
  const [form, setForm] = useState<ProjectInput>(emptyForm);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!form.projectName.trim()) return;
    startTransition(async () => {
      try {
        const newItem = await saveProject(resumeId, form);
        toast.success("Project added.");
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
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2">
        <Label htmlFor="rp-name">Project name *</Label>
        <Input
          id="rp-name"
          value={form.projectName}
          onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
          placeholder="e.g. Dos Bocas New Refinery"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rp-industry">Industry</Label>
          <Input
            id="rp-industry"
            value={form.industry ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value || null }))}
            placeholder="e.g. Oil & Gas"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rp-role">Role</Label>
          <Input
            id="rp-role"
            value={form.role ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value || null }))}
            placeholder="e.g. Manager"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rp-year">Year</Label>
          <Input
            id="rp-year"
            type="number"
            value={form.year ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value ? parseInt(e.target.value) : null }))}
            placeholder="YYYY"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rp-value">Project Value</Label>
          <Input
            id="rp-value"
            value={form.projectValue ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, projectValue: e.target.value || null }))}
            placeholder="e.g. $18.5B"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rp-expanded">Expanded Title</Label>
          <Input
            id="rp-expanded"
            value={form.expandedTitle ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, expandedTitle: e.target.value || null }))}
            placeholder="Additional context..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rp-desc">Description</Label>
        <Textarea
          id="rp-desc"
          rows={3}
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
          placeholder="Scope and achievements..."
        />
      </div>
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
  initial: Project[];
  onItemsChange?: (items: Project[]) => void;
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
    updateItems,
  } = useGenericSection({
    resumeId,
    tableName: "ResumeProjects",
    initial,
    onItemsChange,
    onPersisted,
    removeAction: removeProject,
    reorderAction: reorderProjectsAction,
    headerActions,
  });

  return (
    <SectionShell
      title="Project List"
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
                onClick={() => { if (!disabled) setOpen(true); }}
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
