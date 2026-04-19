"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2 } from "lucide-react";

import { saveResumeProfile } from "@/lib/actions/onboarding.actions";
import type { ProfileFormValues, ReminderMonthsOption } from "@/lib/db/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const REMINDER_OPTIONS: { value: ReminderMonthsOption; label: string }[] = [
  { value: 3, label: "Every 3 months" },
  { value: 6, label: "Every 6 months" },
  { value: 9, label: "Every 9 months" },
  { value: 12, label: "Every 12 months" },
];

const initialForm: ProfileFormValues = {
  jobTitle: "",
  professionalSummary: "",
  reminderMonths: 6,
  personalEmail: "",
  personalPhone: "",
  homeAddress: "",
};

export type OnboardingWizardProps = {
  resumeId: string;
};

export function OnboardingWizard({ resumeId }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<ProfileFormValues>(initialForm);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const progressValue = step === 1 ? 50 : 100;

  function goNextFromStep1() {
    setStep1Error(null);
    if (!form.jobTitle.trim()) {
      setStep1Error("Job title is required.");
      return;
    }
    setStep(2);
  }

  async function handleFinalSubmit() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await saveResumeProfile(resumeId, form);
      router.push("/dashboard/resume");
    } catch {
      setSubmitError("We could not save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg p-4 md:p-6">
      <Progress value={progressValue} className="mb-6">
        <div className="flex w-full items-center justify-between gap-2">
          <ProgressLabel>Step {step} of 2</ProgressLabel>
          <ProgressValue />
        </div>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about yourself</CardTitle>
            <CardDescription>
              This information appears on your resume profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                value={form.jobTitle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, jobTitle: e.target.value }))
                }
                required
                autoComplete="organization-title"
                aria-invalid={Boolean(step1Error)}
              />
              {step1Error ? (
                <p className="text-sm text-destructive">{step1Error}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="summary">Professional summary</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {form.professionalSummary.length}/500
                </span>
              </div>
              <Textarea
                id="summary"
                value={form.professionalSummary}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    professionalSummary: e.target.value.slice(0, 500),
                  }))
                }
                maxLength={500}
                rows={5}
                placeholder="Brief overview of your experience and goals"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label>Update reminder</Label>
              <RadioGroup
                value={String(form.reminderMonths)}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    reminderMonths: Number(v) as ReminderMonthsOption,
                  }))
                }
                className="gap-3"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={String(opt.value)} id={`rm-${opt.value}`} />
                    <Label htmlFor={`rm-${opt.value}`} className="font-normal">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t border-border pt-4">
            <Button type="button" onClick={goNextFromStep1}>
              Next
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contact details (private — encrypted at rest)</CardTitle>
            <CardDescription>
              Only you can see these fields when signed in.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Alert>
              <Info className="size-4" aria-hidden />
              <AlertTitle>Encrypted storage</AlertTitle>
              <AlertDescription>
                These fields are encrypted and never visible to your employer&apos;s
                IT team.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Label htmlFor="personalEmail">Personal email (optional)</Label>
              <Input
                id="personalEmail"
                type="email"
                value={form.personalEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, personalEmail: e.target.value }))
                }
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="personalPhone">Personal phone (optional)</Label>
              <Input
                id="personalPhone"
                type="tel"
                value={form.personalPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, personalPhone: e.target.value }))
                }
                autoComplete="tel"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="homeAddress">Home address (optional)</Label>
              <Textarea
                id="homeAddress"
                value={form.homeAddress}
                onChange={(e) =>
                  setForm((f) => ({ ...f, homeAddress: e.target.value }))
                }
                rows={3}
              />
            </div>
            {submitError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}
          </CardContent>
          <CardFooter className="flex justify-between gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              type="button"
              className="inline-flex items-center gap-2"
              onClick={() => void handleFinalSubmit()}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2
                    className="size-4 shrink-0 animate-spin"
                    aria-hidden
                  />
                  <span>Saving…</span>
                </>
              ) : (
                "Save and continue"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
