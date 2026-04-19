"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronDown } from "lucide-react";

interface MonthYearPickerProps {
  value: string | null; // ISO string format YYYY-MM-DD
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1960 + 11 }, (_, i) => 
  (1960 + i)
).filter(y => y <= CURRENT_YEAR + 5);

export function MonthYearPicker({ value, onChange, disabled, className }: MonthYearPickerProps) {
  // Parse value
  const { year, month } = React.useMemo(() => {
    if (!value) return { year: null, month: null };
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
         const parts = value.split("-");
         return {
           year: parseInt(parts[0]),
           month: parseInt(parts[1]) - 1,
         };
      }
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth(),
      };
    } catch {
      return { year: null, month: null };
    }
  }, [value]);

  const handleYearSelect = (y: number) => {
    const m = month !== null ? month + 1 : 1;
    const mStr = m.toString().padStart(2, "0");
    onChange(`${y}-${mStr}-01`);
  };

  const handleMonthSelect = (mIndex: number) => {
    const y = year !== null ? year : CURRENT_YEAR;
    const mStr = (mIndex + 1).toString().padStart(2, "0");
    onChange(`${y}-${mStr}-01`);
  };

  const label = React.useMemo(() => {
    if (month === null || year === null) return "Select date";
    return `${MONTHS[month]} ${year}`;
  }, [month, year]);

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-card px-3 text-sm font-medium shadow-sm transition-colors hover:bg-sidebar-accent/30 focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 outline-none",
          !value && "text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </div>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground shadow-none" />
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[190px] p-0 overflow-hidden border-border bg-popover shadow-xl ring-1 ring-black/5">
        <div className="flex h-60">
          {/* Months Column */}
          <div className="flex flex-1 flex-col overflow-y-auto py-1 scrollbar-none">
            <div className="sticky top-0 bg-popover/95 backdrop-blur px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Month
            </div>
            <div className="px-1">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthSelect(i)}
                  className={cn(
                    "w-full rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground",
                    month === i && "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:text-primary-foreground"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px bg-border/50" />

          {/* Years Column */}
          <div className="flex flex-1 flex-col overflow-y-auto py-1 scrollbar-none bg-neutral-50/30">
            <div className="sticky top-0 bg-neutral-50/95 backdrop-blur px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Year
            </div>
            <div className="px-1">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleYearSelect(y)}
                  className={cn(
                    "w-full rounded-md px-2.5 py-1.5 text-center text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground",
                    year === y && "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:text-primary-foreground"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
