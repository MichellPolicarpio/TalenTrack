"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2, AlertCircle } from "lucide-react";
import { useDashboard } from "@/lib/context/dashboard-context";

interface DeleteConfirmPopoverProps {
  onConfirm: () => void;
  title?: string;
  className?: string;
  disabled?: boolean;
}

export function DeleteConfirmPopover({
  onConfirm,
  title = "Delete this entry?",
  className,
  disabled
}: DeleteConfirmPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const { triggerEditHint } = useDashboard();

  return (
    <div className="relative">
      {disabled && (
        <div 
          className="absolute inset-0 z-10 cursor-not-allowed" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerEditHint();
          }}
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            className,
            open && "bg-red-50 text-red-600 shadow-inner"
          )}
        >
          <Trash2 className="size-[15px]" />
        </PopoverTrigger>
        <PopoverContent 
          align="start" 
          side="top" 
          sideOffset={10}
          className="z-[100] w-[240px] rounded-xl border border-neutral-100 bg-white p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-semibold leading-tight text-neutral-900">
                  Confirm Deletion
                </p>
                <p className="text-[12px] text-neutral-500 leading-normal">
                  {title}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1 rounded-lg border-neutral-200 text-[12px] font-medium transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 flex-1 rounded-lg bg-red-600 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98]"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
