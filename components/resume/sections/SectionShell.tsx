"use client";

import { useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SectionShellProps = {
  title: string;
  addLabel: string;
  bottomLabel?: string;
  children: React.ReactNode;
  form: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  headerActions?: React.ReactNode;
  onActivateEdit?: () => void;
};

export function SectionShell({
  title,
  addLabel,
  bottomLabel,
  children,
  form,
  open,
  onOpenChange,
  disabled = false,
  headerActions,
  onActivateEdit,
}: SectionShellProps) {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [open]);

  return (
    <section className="flex flex-col gap-4">
      <div className="sticky top-0 z-20 pb-2 pt-2 md:pb-3 md:pt-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] md:text-[18px] font-semibold text-card-foreground">{title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {!disabled ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (disabled && onActivateEdit) onActivateEdit();
                  onOpenChange(true);
                }}
                className="h-8 lg:h-9 gap-1.5 rounded-lg border-primary/30 px-3 lg:px-4 text-[12px] lg:text-[13px] font-medium text-primary shadow-sm hover:bg-sidebar-accent/50 hover:text-primary"
              >
                <Plus className="size-3 lg:size-3.5" aria-hidden />
                {addLabel}
              </Button>
            ) : null}
            {headerActions}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-md border border-border/20 sm:p-7">
        {children}

      {open ? (
        <div
          ref={formRef}
          className="mt-2 w-full min-w-0 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-card-foreground/80">{addLabel}</h3>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          {form}
        </div>
      ) : null}

        <button
          type="button"
          onClick={() => {
            if (disabled && onActivateEdit) onActivateEdit();
            onOpenChange(true);
          }}
          className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-transparent text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" />
          {bottomLabel || (addLabel === "Add" ? "Add New Entry" : `Add ${addLabel}`)}
        </button>
      </div>
    </section>
  );
}
