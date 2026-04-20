"use client";

import { forwardRef, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type {
  ResumeProfile,
  WorkExperience,
  Education,
  Skill,
  Certification,
  Project,
  License,
  Achievement,
} from "@/lib/db/types";

export type ResumePreviewProps = {
  employeeName: string;
  profile: ResumeProfile | null;
  experiences: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  projects: Project[];
  licenses: License[];
  achievements: Achievement[];
  className?: string;
  style?: React.CSSProperties;
  activeTab?: string;
  isAddingCert?: boolean;
  isAddingLicense?: boolean;
  newCertDraft?: any;
  newLicenseDraft?: any;
};

/** Brand orange aligned with Brindley logo artwork */
const ORANGE = "#E87722";
const GRAY_GRADIENT = "linear-gradient(to bottom, #f9f9f9, #e6e6e6)";

/** Vertical orange rail width (px) — full height from top through header + body */
const ORANGE_RAIL_PX = 28;

function formatMonthYear(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
  
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(dateObj);
}

function formatExpRange(exp: WorkExperience): string {
  const start = formatMonthYear(exp.startDate);
  const end = exp.isCurrent ? "Present"
    : formatMonthYear(exp.endDate);
  if (!start && !end) return "";
  if (!start) return end;
  if (!end) return start;
  return `${start} — ${end}`;
}

function isPeFeCertification(name: string): boolean {
  return /\b(PE|P\.E\.|FE|F\.E\.|EIT|Professional Engineer|Fundamentals of Engineering)\b/i.test(
    name,
  );
}

function formatProjectHeaderLine(p: Project): string {
  const main = p.projectName;
  const sub = [p.year?.toString(), p.industry, p.role, p.projectValue]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" | ");
  
  if (!main) return sub;
  if (!sub) return main;
  return `${main} - ${sub}`;
}

function LeftSectionTitle({
  children,
  first,
}: {
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <h3
      className={`mb-2 text-[12pt] font-bold tracking-tight text-[#000000] ${first ? "mt-0" : "mt-4"}`}
    >
      <span className="block border-b-[3px] pb-1" style={{ borderColor: ORANGE }}>
        {children}
      </span>
    </h3>
  );
}

function RightSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 border-b-[3px] border-neutral-300 pb-1 text-[12pt] font-bold tracking-tight text-[#000000]">
      {children}
    </h3>
  );
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  function ResumePreview(
    {
      employeeName,
      profile,
      experiences,
      education,
      skills,
      certifications,
      projects,
      licenses,
      achievements = [],
      className,
      style,
      activeTab,
      isAddingCert,
      isAddingLicense,
      newCertDraft,
      newLicenseDraft,
    },
    ref,
  ) {
    const [logoOk, setLogoOk] = useState(true);
    const page1Ref = useRef<HTMLDivElement>(null);
    const page2Ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (activeTab === "projects") {
        page2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (activeTab && activeTab !== "projects") {
        page1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, [activeTab]);

    // Centralized filtering (TD-08)
    const visibleExp = experiences.filter((e) => e.isVisibleOnResume);
    const visibleEdu = education.filter((e) => e.isVisibleOnResume);
    const visibleSkills = skills.filter((s) => s.isVisibleOnResume);
    const visibleCerts = certifications.filter((c) => c.isVisibleOnResume);
    const visibleProjects = projects.filter((p) => p.isVisibleOnResume);
    const visibleLicenses = licenses.filter((l) => l.isVisibleOnResume);
    const visibleAchievements = achievements.filter((a) => a.isVisibleOnResume);

    // Merge in-progress drafts for real-time preview (TD-09)
    const finalVisibleCerts = [...visibleCerts];
    if (newCertDraft && newCertDraft.certificationName?.trim()) {
      finalVisibleCerts.push({
        ...newCertDraft,
        id: "new-draft-id",
        isVisibleOnResume: true,
        issueDate: newCertDraft.issueDate ? new Date(newCertDraft.issueDate) : null,
        expirationDate: newCertDraft.expirationDate ? new Date(newCertDraft.expirationDate) : null,
      } as any);
    }

    const finalVisibleLicenses = [...visibleLicenses];
    if (newLicenseDraft && newLicenseDraft.licenseType?.trim()) {
      finalVisibleLicenses.push({
        ...newLicenseDraft,
        id: "new-draft-lic-id",
        isVisibleOnResume: true,
        expirationDate: newLicenseDraft.expirationDate ? new Date(newLicenseDraft.expirationDate) : null,
      } as any);
    }

    const hasBodyContent =
      visibleExp.length > 0 ||
      visibleEdu.length > 0 ||
      visibleSkills.length > 0 ||
      finalVisibleCerts.length > 0 ||
      visibleProjects.length > 0 ||
      finalVisibleLicenses.length > 0 ||
      visibleAchievements.length > 0;

    const sidebarCerts = visibleCerts.slice(0, 5);
    const peFeCerts = visibleCerts.filter((c) =>
      isPeFeCertification(c.certificationName),
    );

    const phone = profile?.personalPhone?.trim() || null;
    const email =
      profile?.personalEmail?.trim() || null;

    const summaryText = profile?.professionalSummary?.trim() ?? "";
    const summaryDisplay =
      summaryText ||
      "Add your professional summary in the Personal Info tab. It will appear here and on your exported PDF.";

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-10 pt-0 px-4 pb-10 bg-[#E0DBD4] overflow-y-auto", className)}
        style={{
          fontFamily: 'var(--font-tw-cen), "Tw Cen MT", "Tw Cen MT Condensed", "Century Gothic", system-ui, -apple-system, "Segoe UI", sans-serif',
          ...style,
        }}
      >
        {/* ─── PAGE 1 ─── */}
        <div
          ref={page1Ref}
          className="resume-page-sheet relative mx-auto flex h-[1056px] w-[816px] min-w-[816px] flex-col overflow-hidden bg-white shadow-[0_0_120px_rgba(0,0,0,0.06),0_0_60px_rgba(0,0,0,0.04),0_0_20px_rgba(0,0,0,0.03)]"
          style={{
            fontFamily: 'var(--font-tw-cen), "Tw Cen MT", "Tw Cen MT Condensed", "Century Gothic", system-ui, -apple-system, "Segoe UI", sans-serif',
            fontSize: "11pt",
            lineHeight: 1.15,
            ...style,
          }}
        >
        {/* ─── Main sheet: orange rail (full height to footer) + content column ─── */}
        <div className="box-border flex min-h-0 w-full flex-1 flex-row items-stretch">
          <div
            className="shrink-0 self-stretch"
            style={{ width: ORANGE_RAIL_PX, backgroundColor: ORANGE }}
            aria-hidden
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Header — starts to the right of the orange rail */}
              <header
                className="flex shrink-0 flex-row items-center justify-between px-8 py-[12pt]"
                style={{ background: 'linear-gradient(to right, #eeeeee, #d2d2d2)' }}
              >
                <div className="min-w-0 pr-4">
                  <h1 className="text-[30pt] leading-tight tracking-tight text-[#000000]">
                    {employeeName || "Your Name"}
                  </h1>
                  {profile?.jobTitle ? (
                    <p className="mt-1 text-[20pt] text-[#000000]">
                      {profile.jobTitle}
                    </p>
                  ) : null}
                </div>
              <div className="shrink-0 pt-0.5">
                {logoOk ? (
                  // eslint-disable-next-line @next/next/no-img-element -- native img so html2canvas matches on-screen PDF export
                  <img
                    src="/BE_Logo_Orange_Dark_TM.png"
                    alt="BE Brindley Engineering"
                    width={360}
                    height={86}
                    className="h-[64px] w-auto max-w-[320px] object-contain object-right"
                    crossOrigin="anonymous"
                    decoding="sync"
                    onError={() => setLogoOk(false)}
                  />
                ) : (
                  <div className="text-right text-[11pt] font-semibold text-[#000000]">
                    <span style={{ color: ORANGE }}>B</span>E · Brindley Engineering
                  </div>
                )}
              </div>
            </header>

            {/* Body: gray sidebar + white column */}
            <div className="box-border flex min-h-0 w-full flex-1 flex-row items-stretch">
              <aside
                className="box-border flex min-h-0 w-[38%] shrink-0 flex-col self-stretch px-8 py-5"
                style={{
                  background: GRAY_GRADIENT,
                }}
              >
                <section className="mb-4">
                  <LeftSectionTitle first>Professional Summary</LeftSectionTitle>
                  <p
                    className={`text-[11pt] text-left ${summaryText ? "text-[#000000]" : "italic text-[#9CA3AF]"
                      }`}
                  >
                    {summaryDisplay}
                  </p>
                </section>

                {finalVisibleLicenses.length > 0 || finalVisibleCerts.length > 0 || isAddingCert || isAddingLicense ? (
                  <section className="mb-4">
                    <LeftSectionTitle>
                      {(finalVisibleLicenses.length > 0 || isAddingLicense) && (finalVisibleCerts.length > 0 || isAddingCert)
                        ? "Licenses / Certifications"
                        : finalVisibleLicenses.length > 0 || isAddingLicense
                        ? "Licenses"
                        : "Certifications"}
                    </LeftSectionTitle>
                    <ul className="space-y-2">
                       {/* --- Licenses --- */}
                       {finalVisibleLicenses.map((lic) => (
                         <li key={lic.id} className="flex gap-2 text-[11pt] text-[#000000]">
                           <span className="shrink-0 font-bold" style={{ color: ORANGE }}>•</span>
                           <div className="flex-1">
                             <p className="font-bold leading-tight">
                               {[lic.licenseType, lic.jurisdiction, lic.status]
                                 .filter(Boolean)
                                 .join(" | ")}
                             </p>
                             {lic.licenseNumber ? (
                               <p className="text-[10pt] opacity-85">No. {lic.licenseNumber}</p>
                             ) : null}
                           </div>
                         </li>
                       ))}
                       
                       {/* --- Certifications --- */}
                       {finalVisibleCerts.map((cert) => (
                         <li key={cert.id} className="flex gap-2 text-[11pt] text-[#000000]">
                           <span className="shrink-0 font-bold" style={{ color: ORANGE }}>•</span>
                           <div className="flex-1">
                             <p className="font-bold leading-tight">{cert.certificationName}</p>
                             {cert.issuingOrganization ? (
                               <p className="text-[10pt] opacity-85">{cert.issuingOrganization}</p>
                             ) : null}
                           </div>
                         </li>
                       ))}
                    </ul>
                  </section>
                ) : null}



                {visibleEdu.length > 0 ? (
                  <section className="mb-4">
                    <LeftSectionTitle>Education</LeftSectionTitle>
                    <div className="flex flex-col gap-3">
                      {visibleEdu.map((edu) => (
                        <div key={edu.id}>
                          <p className="text-[11pt] font-bold text-[#000000]">
                            {edu.institutionName}
                          </p>
                          <p className="text-[11pt] italic text-[#000000]">
                            {edu.degreeType ? `${edu.degreeType} in ` : ""}
                            {edu.degree}
                            {edu.specialization ? `, ${edu.specialization}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {visibleAchievements.length > 0 ? (
                  <section className="mb-4">
                    <LeftSectionTitle>Achievements</LeftSectionTitle>
                    <ul className="space-y-2">
                      {visibleAchievements.map((ach) => (
                        <li key={ach.id} className="flex gap-2 text-[11pt] text-[#000000]">
                          <span className="shrink-0 font-bold" style={{ color: ORANGE }}>
                            •
                          </span>
                          <div className="flex-1 text-left">
                            <p className="font-bold leading-tight">
                              {ach.year ? `${ach.year} | ` : ""}{ach.title}
                            </p>
                            {ach.organization ? (
                              <p className="text-[10pt] opacity-85 leading-snug">
                                {ach.organization}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {visibleSkills.length > 0 ? (
                  <section className="mb-4">
                    <LeftSectionTitle>Expertise</LeftSectionTitle>
                    <ul className="space-y-1">
                      {visibleSkills.map((skill) => (
                        <li key={skill.id} className="flex gap-2 text-[11pt] text-[#000000]">
                          <span className="shrink-0 font-bold" style={{ color: ORANGE }}>
                            •
                          </span>
                          <span>{skill.skillName}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <div className="min-h-4 flex-1" aria-hidden />
              </aside>

              {/* Right column (white) — same stretched height as sidebar */}
              <main className="box-border min-h-0 min-w-0 flex-1 self-stretch bg-white px-8 py-5">
                {visibleExp.length > 0 ? (
                  <section className="mb-5">
                    <RightSectionTitle>Professional Experience</RightSectionTitle>
                    <div className="flex flex-col gap-4">
                      {visibleExp.map((exp) => {
                        const loc = exp.location?.trim();
                        const companyLine = loc
                          ? `${exp.companyName} | ${loc}`
                          : exp.companyName;
                        const lines = exp.description
                          ? exp.description
                            .split("\n")
                            .map((l) => l.replace(/^[-•]\s*/, "").trim())
                            .filter(Boolean)
                            .join("\n")
                            .split("\n")
                          : [];
                        return (
                          <div key={exp.id}>
                            <h4 className="mb-0.5 text-[11pt] text-[#000000]">
                              {[exp.companyName, exp.jobTitle, formatExpRange(exp)]
                                .filter(Boolean)
                                .join(" | ")}
                            </h4>
                            {lines.length > 0 ? (
                              <ul className="space-y-0.5">
                                {lines.map((line, i) => (
                                  <li
                                    key={i}
                                    className="flex gap-2 text-[11pt] text-[#000000]"
                                  >
                                    <span
                                      className="shrink-0 font-bold"
                                      style={{ color: ORANGE }}
                                    >
                                      •
                                    </span>
                                    <span>{line}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {!hasBodyContent && !summaryText ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                    <p className="text-[11pt] font-medium text-neutral-400">
                      Your resume preview will appear here
                    </p>
                    <p className="text-[11pt] text-neutral-300">
                      Add sections on the left to get started
                    </p>
                  </div>
                ) : null}
              </main>
            </div>
          </div>
        </div>

        {/* ─── Footer: rail + gray sidebar (border-r como el aside) + orange al ras ─── */}
        <footer className="box-border flex w-full shrink-0 flex-row items-stretch">
          <div
            className="shrink-0 self-stretch"
            style={{ width: ORANGE_RAIL_PX, backgroundColor: ORANGE }}
            aria-hidden
          />
          <div className="flex min-h-[3.5rem] min-w-0 flex-1 flex-row items-stretch">
            <div
              className="box-border flex w-[38%] shrink-0 flex-col items-center justify-center px-6 py-3 text-center"
              style={{ backgroundColor: "#e6e6e6" }}
            >
              <p className="font-bold leading-[0.9] tracking-tight text-[#000000]">
                <span className="text-[34pt]" style={{ color: ORANGE }}>
                  BE
                </span>
                <span className="text-[28pt]"> On.</span>
              </p>
              <p className="mt-1.5 text-[11pt] text-[#000000]">
                brindleyengineering.com
              </p>
            </div>
            <div
              className="box-border flex min-w-0 flex-1 flex-row items-stretch justify-between gap-6 px-8 py-3 text-white"
              style={{ backgroundColor: ORANGE }}
            >
              <div className="min-w-0">
                <p className="mb-1 text-[12pt] font-bold">Contact</p>
                {phone ? (
                  <p className="text-[11pt] leading-snug opacity-95">{phone}</p>
                ) : null}
                {email ? (
                  <p className="text-[11pt] leading-snug opacity-95">{email}</p>
                ) : null}
              </div>
              <div className="max-w-[55%] shrink-0 border-l border-white/40 pl-4">
                <p className="text-right text-[11pt] italic leading-snug text-white/90">
                  Detailed project history
                  <br />
                  available in the attached
                  <br />
                  Project List
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

        {/* ─── PAGE 2 (Independent) ─── */}
        <div
          ref={page2Ref}
          className="resume-page-sheet relative mx-auto flex h-[1056px] w-[816px] min-w-[816px] flex-col overflow-hidden bg-white shadow-[0_0_120px_rgba(0,0,0,0.06),0_0_60px_rgba(0,0,0,0.04),0_0_20px_rgba(0,0,0,0.03)]"
          style={{
            fontFamily: 'var(--font-tw-cen), "Tw Cen MT", "Tw Cen MT Condensed", "Century Gothic", system-ui, -apple-system, "Segoe UI", sans-serif',
            fontSize: "11pt",
            lineHeight: 1.15,
          }}
        >
          {/* Main content row with orange rail */}
          <div className="box-border flex min-h-0 w-full flex-1 flex-row items-stretch">
            <div
              className="shrink-0 self-stretch"
              style={{ width: ORANGE_RAIL_PX, backgroundColor: ORANGE }}
              aria-hidden
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {/* Header — identical to Page 1 */}
              <header
                className="flex shrink-0 flex-row items-center justify-between px-8 py-[12pt]"
                style={{ background: 'linear-gradient(to right, #eeeeee, #d2d2d2)' }}
              >
                <div className="min-w-0 pr-4">
                  <h1 className="text-[30pt] leading-tight tracking-tight text-[#000000]">
                    {employeeName || "Your Name"}
                  </h1>
                  {profile?.jobTitle ? (
                    <p className="mt-1 text-[20pt] text-[#000000]">
                      {profile?.jobTitle}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0">
                  {logoOk ? (
                    // eslint-disable-next-line @next/next/no-img-element -- native img so html2canvas matches on-screen PDF export
                    <img
                      src="/BE_Logo_Orange_Dark_TM.png"
                      alt="BE Brindley Engineering"
                      width={360}
                      height={86}
                      className="h-[64px] w-auto max-w-[320px] object-contain object-right"
                      crossOrigin="anonymous"
                      decoding="sync"
                      onError={() => setLogoOk(false)}
                    />
                  ) : (
                    <div className="text-right text-[11pt] font-semibold text-[#000000]">
                      <span style={{ color: ORANGE }}>B</span>E · Brindley Engineering
                    </div>
                  )}
                </div>
              </header>

              {/* Main content: Full width (no sidebar) */}
              <main className="flex min-w-0 flex-1 flex-col px-8 py-5">
                {visibleProjects.length > 0 ? (
                  <section className="mb-5">
                    <RightSectionTitle>Project List</RightSectionTitle>

                    {visibleProjects.map((p, idx) => {
                      const desc = (p.description ?? "").trim();
                      return (
                        <div key={p.id} className="mb-4">
                          {/* Table Container */}
                          <div className="border border-[#D1D5DB]">
                            {/* Table header row */}
                            <div
                              className="grid border-b border-[#D1D5DB] text-[9pt] font-bold text-[#000000]"
                              style={{ gridTemplateColumns: "17% 30% 22% 18% 13%" }}
                            >
                              <div className="border-r border-[#D1D5DB] px-1.5 py-0.5">Industry</div>
                              <div className="border-r border-[#D1D5DB] px-1.5 py-0.5">Project</div>
                              <div className="border-r border-[#D1D5DB] px-1.5 py-0.5">Role</div>
                              <div className="border-r border-[#D1D5DB] px-1.5 py-0.5">Value</div>
                              <div className="px-1.5 py-0.5">Year</div>
                            </div>
                            
                            {/* Table data row */}
                            <div
                              className="grid text-[9.5pt] text-[#000000]"
                              style={{ gridTemplateColumns: "17% 30% 22% 18% 13%" }}
                            >
                              <div className="border-r border-[#D1D5DB] px-1.5 py-0.5 break-words">{p.industry ?? ""}</div>
                              <div className="border-r border-[#D1D5DB] px-1.5 py-0.5 break-words">{p.projectName}</div>
                              <div className="border-r border-[#D1D5DB] px-1.5 py-0.5 break-words">{p.role ?? ""}</div>
                              <div className="border-r border-[#D1D5DB] px-1.5 py-0.5 break-words">{p.projectValue ?? ""}</div>
                              <div className="px-1.5 py-0.5 break-words">{p.year ?? ""}</div>
                            </div>
                          </div>

                          {/* Expanded title  (bold, like the Sample label in the image) */}
                          {p.expandedTitle && (
                            <p className="mt-2 text-[9.5pt] font-bold text-[#000000] leading-snug">
                              {p.expandedTitle}
                            </p>
                          )}

                          {/* Description paragraph */}
                          {desc && (
                            <p className="mt-0.5 text-[9pt] text-[#000000] leading-snug text-justify">
                              {desc}
                            </p>
                          )}

                          {/* Divider between projects */}
                          {idx < visibleProjects.length - 1 && (
                            <div className="mt-4 border-b border-[#E5E7EB]" />
                          )}
                        </div>
                      );
                    })}
                  </section>
                ) : null}

              </main>
            </div>
          </div>

          {/* Minimalist Footer (BE On. logo only) */}
          <footer className="box-border flex w-full shrink-0 flex-row items-stretch">
            <div
              className="shrink-0 self-stretch"
              style={{ width: ORANGE_RAIL_PX, backgroundColor: ORANGE }}
              aria-hidden
            />
            <div className="flex min-h-[3.5rem] min-w-0 flex-1 flex-row items-stretch bg-white">
              {/* Minimalist footer for Page 2 — no branding or legends */}
            </div>
          </footer>
        </div>
      </div>
    );
  },
);
