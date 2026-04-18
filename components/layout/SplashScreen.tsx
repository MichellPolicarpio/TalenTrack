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
};
const RESUME_LINE_WIDTHS = ["78%", "62%", "88%", "55%", "71%"] as const;
const RESUME_LINE_EXTRA_WIDTHS = ["66%", "82%"] as const;
const SPLASH_STEP_INTERVAL_MS = 1200;

export function SplashScreen({ steps = DEFAULT_STEPS }: SplashScreenProps) {
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
    }, SPLASH_STEP_INTERVAL_MS);

    return () => window.clearTimeout(timeoutId);
  }, [stepIndex, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white"
    >
      <div className="relative flex min-h-screen w-full max-w-[960px] flex-col items-center px-2 py-6 md:px-3 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="-ml-1 mt-2 flex items-center gap-1.5 self-start md:-ml-2 md:mt-3 md:gap-2"
        >
          <div className="flex size-7 items-center justify-center rounded-[8px] bg-[#F47C20] shadow-sm md:size-8 md:rounded-[9px]">
            <span className="text-base font-black leading-none text-white md:text-lg">T</span>
          </div>
          <div className="leading-none">
            <p className="text-[14px] font-black tracking-tight text-[#404348] md:text-[17px]">TALENTTRACK</p>
            <p className="-mt-0.5 text-[16px] font-black text-[#F47C20] md:text-[19px]">APP</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="mt-[30vh] flex w-full max-w-[400px] flex-col items-center md:mt-[33vh]"
        >
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="relative -translate-y-10 mb-8 w-[128px] rounded-xl border border-[#DDE3EA] bg-white px-3 py-3.5 shadow-[0_12px_26px_-18px_rgba(20,30,44,0.55)] md:-translate-y-12 md:mb-10 md:w-[140px] md:px-3.5 md:py-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="h-2 w-11 rounded-full bg-[#F47C20]/30" />
              <motion.div
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                className="h-1.5 w-1.5 rounded-full bg-[#F47C20]"
              />
            </div>
            <div className="space-y-2">
              {RESUME_LINE_WIDTHS.map((width, index) => (
                <div key={width} className="relative h-2 overflow-hidden rounded-full bg-[#E8EDF3]">
                  <motion.div
                    animate={{
                      width: [
                        "14%",
                        width,
                        `${Math.max(16, Number.parseInt(width, 10) - 12)}%`,
                        width,
                      ],
                    }}
                    transition={{
                      duration: 1.7,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.12,
                    }}
                    className="absolute inset-y-0 left-0 rounded-full bg-[#4B5563]"
                  />
                </div>
              ))}
              {RESUME_LINE_EXTRA_WIDTHS.map((width, index) => (
                <div key={width} className="relative h-2 overflow-hidden rounded-full bg-[#E8EDF3]">
                  <motion.div
                    animate={{
                      width: [
                        "18%",
                        width,
                        `${Math.max(22, Number.parseInt(width, 10) - 10)}%`,
                        width,
                      ],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4 + index * 0.15,
                    }}
                    className="absolute inset-y-0 left-0 rounded-full bg-[#4B5563]"
                  />
                </div>
              ))}
            </div>
            <motion.div
              animate={{ y: [0, 10, 20, 30, 40, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute right-3 top-[36px] h-4 w-[1.5px] rounded-full bg-[#111827]/80 md:right-3.5 md:top-[40px]"
            />
          </motion.div>

          <p className="mb-2 whitespace-nowrap text-center text-[20px] font-semibold tracking-tight text-[#4A5568] md:mb-3 md:text-[24px]">
            {steps[stepIndex]}
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#DCE2EA] md:h-2">
            <div
              className="h-full rounded-full bg-black transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium tracking-wide text-[#607089] md:text-sm">{progress}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className="mt-1 flex flex-col items-center pb-4 md:mt-2 md:pb-5"
        >
          <Image
            src={BELogo}
            alt="BE Brindley Engineering"
            priority
            className="h-auto w-[180px] max-w-[36vw] object-contain md:w-[210px]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
