"use client";

import { useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SectionShellProps = {
  title: string;
  addLabel: string;
  children: React.ReactNode;
  form: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  headerActions?: React.ReactNode;
};

export function SectionShell({
  title,
  addLabel,
  children,
  form,
  open,
  onOpenChange,
  disabled = false,
  headerActions,
}: SectionShellProps) {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [open]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[#111827]">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {!open && !disabled ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(true)}
              className="h-9 gap-1.5 rounded-lg border-[#F17A28]/30 px-4 text-[13px] font-medium text-[#F17A28] shadow-sm hover:bg-[#FFF7ED] hover:text-[#F17A28]"
            >
              <Plus className="size-3.5" aria-hidden />
              {addLabel}
            </Button>
          ) : null}
          {headerActions}
        </div>
      </div>

      {children}

      {open ? (
        <div
          ref={formRef}
          className="mt-1 w-full min-w-0 border-t border-neutral-200 pt-5 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800">{addLabel}</h3>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="size-4" />
            </button>
          </div>
          {form}
        </div>
      ) : null}
    </section>
  );
}
