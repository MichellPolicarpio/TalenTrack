"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type PersonalDraft = {
  jobTitle: string;
  professionalSummary: string;
  homeAddress: string;
  personalPhone: string;
  personalEmail: string;
};

export type PersonalTabProps = {
  data: PersonalDraft;
  onChange: (field: keyof PersonalDraft, value: string) => void;
  disabled: boolean;
  showValidation?: boolean;
  headerActions?: React.ReactNode;
};

export function PersonalTab({ 
  data, 
  onChange, 
  disabled, 
  showValidation = false,
  headerActions
}: PersonalTabProps) {
  const jobTitleEmpty = showValidation && !data.jobTitle.trim();
  const emailInvalid = data.personalEmail.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personalEmail);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="sticky top-0 z-20 pb-2 pt-2 md:pb-3 md:pt-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] md:text-[18px] font-semibold text-card-foreground">Personal Information</h2>
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-md border border-border/20 sm:p-7">
        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pt-jobtitle" className="text-[12px] text-[#6B7280]">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <span className="text-[11px] text-[#9CA3AF] tabular-nums">
                {data.jobTitle.length}/35
              </span>
            </div>
            <Input
              id="pt-jobtitle"
              value={data.jobTitle}
              disabled={disabled}
              maxLength={35}
              onChange={(e) => onChange("jobTitle", e.target.value.slice(0, 35))}
              placeholder="e.g. Senior Software Engineer"
              className={jobTitleEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}
            />
            {jobTitleEmpty && (
              <p className="text-[12px] text-red-500">Job title is required.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pt-summary" className="text-[12px] text-[#6B7280]">Professional Summary</Label>
              <span className="text-[11px] text-[#9CA3AF] tabular-nums">
                {data.professionalSummary.length}/450
              </span>
            </div>
            <Textarea
              id="pt-summary"
              rows={4}
              value={data.professionalSummary}
              disabled={disabled}
              maxLength={450}
              onChange={(e) =>
                onChange("professionalSummary", e.target.value.slice(0, 450))
              }
              placeholder="Brief description of your experience and career goals"
            />
          </div>


          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pt-email" className="text-[12px] text-[#6B7280]">Personal Email</Label>
              <Input
                id="pt-email"
                type="email"
                value={data.personalEmail}
                disabled={disabled}
                onChange={(e) => onChange("personalEmail", e.target.value)}
                className={emailInvalid ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {emailInvalid && (
                <p className="text-[12px] text-red-500">Please enter a valid email address.</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pt-phone" className="text-[12px] text-[#6B7280]">Personal Phone</Label>
              <Input
                id="pt-phone"
                type="tel"
                value={data.personalPhone}
                disabled={disabled}
                onChange={(e) => onChange("personalPhone", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pt-address" className="text-[12px] text-[#6B7280]">Address (optional)</Label>
            <Textarea
              id="pt-address"
              rows={2}
              value={data.homeAddress}
              disabled={disabled}
              onChange={(e) => onChange("homeAddress", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
