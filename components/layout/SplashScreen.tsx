"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import BELogo from "@/BE_Logo_Orange_Dark_TM.png";

const DEFAULT_STEPS = [
  "Loading...",
  "Validating session...",
  "Loading profile...",
  "Preparing dashboard...",
  "Finalizing...",
] as const;

type SplashScreenProps = {
  steps?: readonly string[] | string[];
  intervalMs?: number;
};
const RESUME_LINE_WIDTHS = ["78%", "62%", "88%", "55%", "71%"] as const;
const RESUME_LINE_EXTRA_WIDTHS = ["66%", "82%"] as const;
const SPLASH_STEP_INTERVAL_MS = 1600;

export const EXIT_STEPS = [
  "Signing out safely...",
  "Saving your workspace...",
  "Clearing session cache...",
  "Closing connection...",
  "See you soon!",
] as const;

export function SplashScreen({ 
  steps = DEFAULT_STEPS,
  intervalMs = SPLASH_STEP_INTERVAL_MS 
}: SplashScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const progress = useMemo(() => {
    const totalSteps = steps.length;
    const baseProgress = 100 / totalSteps;
    return Math.min(98, 15 + stepIndex * baseProgress);
  }, [stepIndex, steps.length]);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStepIndex((current) => current + 1);
    }, intervalMs);

    return () => window.clearTimeout(timeoutId);
  }, [stepIndex, steps.length, intervalMs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white px-6 py-12 text-center overflow-hidden"
    >
        {/* Centered Logo */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-[280px] sm:max-w-[360px]"
          >
            <Image
              src="/TalenTrack_LogoFull.png"
              alt="TalenTrack Full Logo"
              width={400}
              height={120}
              className="h-auto w-full object-contain"
              priority
            />
          </motion.div>
        </div>

        {/* Bottom group: Loading Status + Footer Branding */}
        <div className="flex flex-col items-center gap-12 w-full max-w-sm">
          {/* Loading status area */}
          <div className="flex w-full flex-col items-center gap-6">
            <p className="h-6 text-[13px] font-medium tracking-wide text-neutral-500">
              {steps[stepIndex]}
            </p>
            
            <div className="flex w-full max-w-[280px] flex-col items-center gap-3 sm:max-w-[320px]">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200/50">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-[9px] font-bold tracking-[0.25em] text-neutral-400 uppercase">
                {Math.round(progress)}%
              </p>
            </div>
          </div>

          {/* Footer Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-300">
              Powered by
            </span>
            <Image
              src={BELogo}
              alt="BE Brindley Engineering"
              priority
              style={{ 
                filter: `grayscale(${Math.max(0, 100 - progress)}%)`,
                opacity: 0.3 + (progress / 100) * 0.7
              }}
              className="h-auto w-[130px] transition-all duration-700 sm:w-[150px]"
            />
          </motion.div>
        </div>
      </motion.div>
  );
}
