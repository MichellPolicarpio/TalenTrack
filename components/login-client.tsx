"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Info,
  ChevronRight,
  X,
  Sparkles,
  Workflow,
  LockKeyhole,
} from "lucide-react";

import { SignInMicrosoftButton } from "@/components/sign-in-microsoft-button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function TalentTrackLogo({ size = "default" }: { size?: "default" | "small" }) {
  const iconSize = size === "small" ? "size-8" : "size-9";
  const textSize = size === "small" ? "text-lg" : "text-xl";
  const iconText = size === "small" ? "text-base" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex ${iconSize} items-center justify-center rounded-lg bg-[#FF6C06]`}>
        <span className={`${iconText} font-bold leading-none text-white`}>T</span>
      </div>
      <span className={`${textSize} font-bold italic tracking-tight text-white`} style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
        Talent<span className="text-[#FF6C06]">Track</span>
      </span>
    </div>
  );
}

const features = [
  {
    icon: FileText,
    title: "Centralized Blueprints",
    description: "Unified document control for corporate engineering credentials.",
  },
  {
    icon: ShieldCheck,
    title: "Identity Security",
    description: "Enterprise-grade single sign-on via Brindley corporate protocol.",
  },
  {
    icon: CheckCircle2,
    title: "Compliance Ready",
    description: "Automated verification for HR queue and project requirements.",
  },
];

export function LoginClient() {
  const [showAboutPanel, setShowAboutPanel] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* ─── Left panel ─── */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-[#0B1120] lg:flex">
        {/* Grid pattern overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `
                linear-gradient(135deg, #ffffff 1px, transparent 1px),
                linear-gradient(225deg, #ffffff 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />
          {/* Gradient fade at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#0B1120] to-transparent" />
        </div>

        {/* Orange accent glow */}
        <div className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-[#FF6C06]/8 blur-[120px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0}>
            <TalentTrackLogo />
          </motion.div>

          {/* Hero text + features */}
          <div className="mx-auto max-w-xl text-center">
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="text-[2.75rem] font-light leading-[1.1] tracking-tight text-white xl:text-[3.25rem]"
              style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
            >
              Your resume,
              <br />
              engineered.
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-neutral-400"
            >
              The resume platform for Brindley Engineering employees.
              Built for precision and authority.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="mx-auto mt-10 flex max-w-lg flex-col gap-5"
            >
              {features.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={3.5 + i * 0.5}
                  className="group flex items-start justify-center gap-4 text-left"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] transition-colors group-hover:border-[#FF6C06]/30 group-hover:bg-[#FF6C06]/10">
                    <feat.icon className="size-[18px] text-[#FF6C06]" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-white">{feat.title}</h3>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">
                      {feat.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={6}
            className="flex items-center justify-between"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
              &copy; {new Date().getFullYear()} Brindley Engineering
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-700">
              REF: BE-7722-PRO
            </span>
          </motion.div>
        </div>
      </div>

      {/* ─── Right panel ─── */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] px-6 lg:w-[45%]">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          className="w-full max-w-[360px]"
        >
          {/* Brindley floating logo */}
          <div className="mb-7 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: [0, -4, 0, 4, 0], scale: 1 }}
              transition={{
                opacity: { delay: 0.25, duration: 0.45 },
                scale: { delay: 0.25, duration: 0.45 },
                y: { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.35 },
              }}
              className="relative flex items-center justify-center"
            >
              <div className="pointer-events-none absolute inset-0 -z-10 h-[92px] w-[92px] rounded-full bg-[#FF6C06]/12 blur-[16px]" />
              <Image
                src="/BrindleyLogo.png"
                alt="Brindley logo"
                width={70}
                height={70}
                className="h-auto w-[70px] object-contain"
                priority
              />
            </motion.div>
          </div>

          {/* Welcome text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mb-8 text-center"
          >
            <h2 className="text-[26px] font-bold tracking-tight text-neutral-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Sign in with your Brindley corporate
              <br />
              account to continue.
            </p>
          </motion.div>

          {/* Sign in button */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <SignInMicrosoftButton />
          </motion.div>

          {/* Divider */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={4}
            className="mt-7 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400">
              Authorized Access Only
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </motion.div>

          {/* System requirements */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4.5}
            className="mt-6 overflow-hidden rounded-xl border border-[#FF6C06]/15 bg-[#FFFBF7]"
          >
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FF6C06]/10">
                <Info className="size-3.5 text-[#FF6C06]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-neutral-800">
                  System Requirements
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">
                  Access to TalentTrack requires a valid @brindley.com email address
                  and active directory permissions.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Learn more link */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={5}
            className="mt-4 flex justify-center"
          >
            <button
              type="button"
              onClick={() => setShowAboutPanel(true)}
              className="group flex items-center gap-1 text-[11px] font-medium text-neutral-400 transition-colors hover:text-[#FF6C06]"
            >
              Learn more about TalentTrack
              <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={6}
            className="mt-12 text-center text-[9px] uppercase leading-[1.8] tracking-[0.2em] text-neutral-400"
          >
            <p>Internal Use Only</p>
            <p className="font-medium text-neutral-500">Brindley Engineering Corporation</p>
            <p>Resume Builder Proposal</p>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {showAboutPanel ? (
            <motion.div
              initial={{ x: "100%", opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.5 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-30 overflow-y-auto bg-white px-6 py-8"
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-20 top-20 h-56 w-56 rounded-full bg-[#FF6C06]/10 blur-3xl" />
                <div className="absolute -left-20 bottom-20 h-48 w-48 rounded-full bg-[#0B1120]/6 blur-3xl" />
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#FF6C06]/35 to-transparent" />
              </div>

              <div className="relative mx-auto w-full max-w-[460px]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FF6C06]">
                      Resume Builder Proposal
                    </p>
                    <h3 className="mt-1 text-[25px] font-bold tracking-tight text-neutral-900">
                      About This Application
                    </h3>
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                        <Sparkles className="size-3 text-[#FF6C06]" />
                        Product
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                        <Workflow className="size-3 text-[#FF6C06]" />
                        Workflow
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                        <LockKeyhole className="size-3 text-[#FF6C06]" />
                        Secure
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAboutPanel(false)}
                    className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                    aria-label="Close app information"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="mb-6 mt-8 h-px w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

                <div className="mt-8 space-y-4 text-[13px] leading-relaxed text-neutral-600">
                  <div className="rounded-xl border border-neutral-200/90 bg-white/90 p-4 shadow-sm">
                    <p className="font-semibold text-neutral-800">Purpose</p>
                    <p className="mt-1.5">
                      TalentTrack is a proposal designed for Brindley Engineering to centralize
                      employee resumes in one secure and auditable workspace.
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-200/90 bg-white/90 p-4 shadow-sm">
                    <p className="font-semibold text-neutral-800">Workflow</p>
                    <ul className="mt-1.5 space-y-1">
                      <li>1. Employee signs in and maintains professional profile sections.</li>
                      <li>2. Resume is submitted to HR queue for review and traceability.</li>
                      <li>3. HR validates and approves resumes for internal opportunities.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-neutral-200/90 bg-white/90 p-4 shadow-sm">
                    <p className="font-semibold text-neutral-800">Core Features</p>
                    <ul className="mt-1.5 space-y-1">
                      <li>- Structured resume sections with consistent formatting.</li>
                      <li>- Dashboard visibility for employee and HR roles.</li>
                      <li>- Review lifecycle support for quality and compliance.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-neutral-200/90 bg-white/90 p-4 shadow-sm">
                    <p className="font-semibold text-neutral-800">Login and Security</p>
                    <p className="mt-1.5">
                      Access uses Microsoft sign-in aligned with Brindley corporate identity,
                      enabling role-based access and controlled internal use.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Mobile: floating logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="fixed left-5 top-5 z-50 lg:hidden"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#FF6C06] shadow-md">
            <span className="text-base font-bold text-white">T</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-neutral-900">
            Talent<span className="text-[#FF6C06]">Track</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
