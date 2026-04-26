"use client";

import { motion } from "framer-motion";
import { 
  Target, 
  Workflow, 
  Sparkles, 
  ShieldCheck, 
  Cpu,
} from "lucide-react";

export default function AboutPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col p-6 md:p-8 space-y-12 max-w-7xl mx-auto">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Purpose */}
        <motion.section variants={item} className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <Target className="size-5" />
          </div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Professional Standards
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            TalenTrack centralizes and elevates the quality of our team's resumes, ensuring a consistent and elite image for Brindley Engineering.
          </p>
        </motion.section>

        {/* Security */}
        <motion.section variants={item} className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Data Protection
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Your professional information is secured by Brindley’s corporate standards, using the same Microsoft identity you use every day.
          </p>
        </motion.section>

        {/* Efficiency */}
        <motion.section variants={item} className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
            <Cpu className="size-5" />
          </div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-600">
            Efficiency
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Engineered for speed and precision, allowing you to update your professional credentials without unnecessary administrative overhead.
          </p>
        </motion.section>

        {/* Impact */}
        <motion.section variants={item} className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white">
            <Sparkles className="size-5" />
          </div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
            High Impact
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Strategic presentation of your expertise, projects, and certifications, designed to impress clients and capture opportunities.
          </p>
        </motion.section>
      </motion.div>

      {/* User Flow Stepper */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-3xl border border-border/50 bg-gradient-to-br from-card to-sidebar p-8 md:p-12 shadow-inner"
      >
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-2xl font-black md:text-4xl text-foreground tracking-tight">Understanding the <span className="text-primary italic">User Flow</span></h2>
          <p className="mt-2 text-muted-foreground">The journey of your professional profile in three simple steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:absolute md:top-12 md:left-[15%] md:right-[15%] md:h-px md:bg-border/60 md:block -z-0" />
          
          {[
            { step: 1, title: "Auth & Identity", desc: "Employee signs in with corporate Microsoft account securely." },
            { step: 2, title: "Structured Input", desc: "Resume sections are completed and updated in the profile editor." },
            { step: 3, title: "Centralized Audit", desc: "Final resume is submitted for HR review and quality approval." }
          ].map((s) => (
            <div key={s.step} className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left group">
              <div className="size-12 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary font-black mb-6 transition-all group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(232,119,34,0.3)] group-hover:bg-primary group-hover:text-white">
                {s.step}
              </div>
              <h3 className="font-bold text-foreground mb-2 text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Footer / Tech Stack */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="pt-12 pb-16 border-t border-border/40 text-center"
      >
        <div className="flex flex-col items-center gap-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
            Internal Capability · TalenTrack V2.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}
