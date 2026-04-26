import React from "react";
import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { FullResumeData, ProficiencyLevel } from "@/lib/db/types";

/** Tw Cen MT is not bundled (Microsoft license). Add TwCenMT-*.ttf under public/fonts/ to use it in PDF; else Helvetica. */
const TW_CEN_REG = path.join(
  process.cwd(),
  "public",
  "fonts",
  "TwCenMT-Regular.ttf",
);
const TW_CEN_BOLD = path.join(
  process.cwd(),
  "public",
  "fonts",
  "TwCenMT-Bold.ttf",
);
const TW_CEN_ITALIC = path.join(
  process.cwd(),
  "public",
  "fonts",
  "TwCenMT-Italic.ttf",
);

const useTwCenPdf =
  fs.existsSync(TW_CEN_REG) && fs.existsSync(TW_CEN_BOLD);

if (useTwCenPdf) {
  Font.register({
    family: "Tw Cen MT",
    fonts: [
      { src: TW_CEN_REG },
      { src: TW_CEN_BOLD, fontWeight: "bold" },
      ...(fs.existsSync(TW_CEN_ITALIC)
        ? [{ src: TW_CEN_ITALIC, fontStyle: "italic" as const }]
        : []),
    ],
  });
}

const pdfFont = {
  regular: () =>
    ({
      fontFamily: useTwCenPdf ? "Tw Cen MT" : "Helvetica",
    }) as const,
  bold: () =>
    useTwCenPdf
      ? ({ fontFamily: "Tw Cen MT", fontWeight: "bold" as const } as const)
      : ({ fontFamily: "Helvetica-Bold" } as const),
  italic: () =>
    useTwCenPdf
      ? fs.existsSync(TW_CEN_ITALIC)
        ? ({ fontFamily: "Tw Cen MT", fontStyle: "italic" as const } as const)
        : ({ fontFamily: "Tw Cen MT" } as const)
      : ({ fontFamily: "Helvetica-Oblique" } as const),
};

const ORANGE = "#F17A28";
const ORANGE_RAIL_PT = 24;
const DARK = "#1a1a1a";
const GRAY = "#555555";
const WHITE = "#FFFFFF";
const PANEL_GRAY = "#E8E8E8";
const RULE_GRAY = "#d4d4d4";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: WHITE,
    ...pdfFont.regular(),
    fontSize: 11,
    color: DARK,
  },

  /** Header + body share this row with the orange rail on the far left (full height). */
  headerBodyRow: {
    flexDirection: "row",
    flexGrow: 1,
    alignSelf: "stretch",
    minHeight: 0,
  },
  orangeRail: {
    width: ORANGE_RAIL_PT,
    backgroundColor: ORANGE,
    alignSelf: "stretch",
  },
  headerBodyColumn: {
    flex: 1,
    flexDirection: "column",
    flexGrow: 1,
    minHeight: 0,
    alignSelf: "stretch",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: PANEL_GRAY,
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: RULE_GRAY,
  },
  employeeName: {
    fontSize: 30,
    color: DARK,
    marginTop: -4,
  },
  employeeTitle: {
    fontSize: 20,
    color: GRAY,
    marginTop: 2,
  },
  logo: {
    width: 280,
    height: 60,
    objectFit: "contain" as const,
  },

  /** Fills space between header and footer so the gray sidebar runs to the footer */
  body: {
    flexDirection: "row",
    flexGrow: 1,
    minHeight: 640,
    alignSelf: "stretch",
  },
  leftColumn: {
    width: "35%",
    flexDirection: "column",
    alignSelf: "stretch",
    backgroundColor: PANEL_GRAY,
    paddingLeft: 28,
    paddingRight: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderRightWidth: 1,
    borderRightColor: RULE_GRAY,
  },
  leftColumnSpacer: {
    flexGrow: 1,
    minHeight: 4,
  },
  rightColumn: {
    width: "65%",
    backgroundColor: WHITE,
    paddingLeft: 20,
    paddingRight: 32,
    paddingTop: 20,
    paddingBottom: 20,
  },

  sectionTitleLeft: {
    fontSize: 12,
    ...pdfFont.bold(),
    color: DARK,
    marginBottom: 2,
    marginTop: 12,
    letterSpacing: 0.3,
  },
  sectionTitleLeftFirst: {
    marginTop: 0,
  },
  sectionDividerLeft: {
    height: 3,
    backgroundColor: ORANGE,
    marginBottom: 8,
  },

  sectionTitleRight: {
    fontSize: 12,
    ...pdfFont.bold(),
    color: DARK,
    marginBottom: 2,
    marginTop: 14,
    letterSpacing: 0.3,
  },
  sectionDividerRight: {
    height: 1,
    backgroundColor: RULE_GRAY,
    marginBottom: 8,
  },

  bodyText: {
    fontSize: 11,
    color: GRAY,
    lineHeight: 1.5,
    textAlign: "justify",
  },
  bodyTextPlaceholder: {
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 1.5,
    ...pdfFont.italic(),
  },
  degreeText: {
    fontSize: 11,
    ...pdfFont.italic(),
    color: "#374151",
    lineHeight: 1.45,
  },

  entryContainer: { marginBottom: 10 },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 11,
    color: DARK,
    flex: 1,
  },
  entryDate: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "right" as const,
  },
  entryCompany: {
    fontSize: 11,
    color: ORANGE,
    marginBottom: 3,
  },
  institutionText: {
    fontSize: 11,
    ...pdfFont.bold(),
    color: DARK,
  },

  bullet: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    fontSize: 11,
    color: ORANGE,
    marginRight: 4,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 11,
    color: GRAY,
    lineHeight: 1.4,
    flex: 1,
  },

  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  skillName: {
    fontSize: 11,
    color: DARK,
    flex: 1,
  },
  skillBarTrack: {
    width: 60,
    height: 3,
    backgroundColor: "#d4d4d4",
    borderRadius: 2,
  },
  skillBarFill: {
    height: 3,
    backgroundColor: ORANGE,
    borderRadius: 2,
  },

  listItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  listDot: {
    fontSize: 11,
    color: ORANGE,
    marginRight: 5,
    marginTop: 1,
  },
  listText: {
    fontSize: 11,
    color: GRAY,
    flex: 1,
    lineHeight: 1.4,
  },

  brandBe: {
    fontSize: 39,
    ...pdfFont.bold(),
    color: ORANGE,
  },
  brandOn: {
    fontSize: 33,
    ...pdfFont.bold(),
    color: DARK,
  },
  brandUrl: {
    fontSize: 11,
    ...pdfFont.regular(),
    color: DARK,
    marginTop: 6,
  },

  footerRow: {
    width: "100%",
    flexDirection: "row",
    flexShrink: 0,
    alignSelf: "stretch",
  },
  footerOrangeRail: {
    width: ORANGE_RAIL_PT,
    backgroundColor: ORANGE,
    alignSelf: "stretch",
  },
  footerInner: {
    flex: 1,
    flexDirection: "row",
    alignSelf: "stretch",
    minWidth: 0,
  },
  footerSidebarFoot: {
    width: "35%",
    backgroundColor: PANEL_GRAY,
    paddingHorizontal: 22,
    paddingVertical: 24,
    minHeight: 108,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderRightWidth: 1,
    borderRightColor: RULE_GRAY,
  },
  footerBrandLine: {
    width: "100%",
    textAlign: "center" as const,
  },
  footerMainOrange: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: ORANGE,
    paddingHorizontal: 32,
    paddingVertical: 24,
    minHeight: 108,
    justifyContent: "space-between",
    alignItems: "stretch",
    minWidth: 0,
  },
  footerContactCol: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  footerRight: {
    maxWidth: "55%",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.45)",
    paddingLeft: 16,
    justifyContent: "center" as const,
  },
  footerLabel: {
    fontSize: 12,
    color: WHITE,
    ...pdfFont.bold(),
    marginBottom: 3,
  },
  footerText: {
    fontSize: 11,
    color: WHITE,
    lineHeight: 1.5,
  },
  footerNote: {
    fontSize: 11,
    ...pdfFont.italic(),
    color: "rgba(255,255,255,0.9)",
    textAlign: "right" as const,
    lineHeight: 1.4,
  },
  
  // Page 2 Specifics
  pageTwoMain: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    flex: 1,
  },
  footerMainMinimal: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: WHITE, // No orange background on page 2 footer
    paddingHorizontal: 32,
    paddingVertical: 24,
    minHeight: 108,
    justifyContent: "space-between",
    alignItems: "stretch",
    minWidth: 0,
  },
  footerTextDark: {
    fontSize: 11,
    color: DARK,
    lineHeight: 1.5,
  },
  footerLabelDark: {
    fontSize: 12,
    color: DARK,
    ...pdfFont.bold(),
    marginBottom: 3,
  },
});

const PROFICIENCY_WIDTH: Record<ProficiencyLevel, number> = {
  Beginner: 15,
  Intermediate: 30,
  Advanced: 45,
  Expert: 60,
};

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return `${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateRange(
  start: Date | null,
  end: Date | null,
  isCurrent: boolean,
): string {
  const s = formatDate(start);
  const e = isCurrent ? "Present" : formatDate(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} — ${e}`;
}

function isPeFeCertification(name: string): boolean {
  return /\b(PE|P\.E\.|FE|F\.E\.|EIT|Professional Engineer|Fundamentals of Engineering)\b/i.test(
    name,
  );
}

function LeftSectionTitle({
  children,
  first,
}: {
  children: string;
  first?: boolean;
}) {
  return (
    <>
      <Text
        style={[
          styles.sectionTitleLeft,
          ...(first ? [styles.sectionTitleLeftFirst] : []),
        ]}
      >
        {children.toUpperCase()}
      </Text>
      <View style={styles.sectionDividerLeft} />
    </>
  );
}

function RightSectionTitle({ children }: { children: string }) {
  return (
    <>
      <Text style={styles.sectionTitleRight}>{children.toUpperCase()}</Text>
      <View style={styles.sectionDividerRight} />
    </>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listDot}>•</Text>
      <Text style={styles.listText}>{text}</Text>
    </View>
  );
}

export function ResumePdfDocument({ data }: { data: FullResumeData }) {
  const { employee, profile } = data;
  const workExperiences = data.workExperiences.filter((e) => e.isVisibleOnResume);
  const education = data.education.filter((e) => e.isVisibleOnResume);
  const skills = data.skills.filter((s) => s.isVisibleOnResume);
  const certifications = data.certifications.filter((c) => c.isVisibleOnResume);
  const projects = data.projects.filter((p) => p.isVisibleOnResume);
  const achievements = data.achievements?.filter((a) => a.isVisibleOnResume) ?? [];
  const licenses = data.licenses?.filter((l) => l.isVisibleOnResume) ?? [];

  const logoPath = `${process.cwd()}/public/BE_Logo_Orange_Dark_TM.png`;
  const sidebarCerts = certifications.slice(0, 5);
  const peFeCerts = certifications.filter((c) =>
    isPeFeCertification(c.certificationName),
  );

  const phone =
    profile?.personalPhone && profile.personalPhone !== ""
      ? profile.personalPhone
      : null;
  const email =
    profile?.personalEmail && profile.personalEmail !== ""
      ? profile.personalEmail
      : employee.corporateEmail;

  const summaryRaw = profile?.professionalSummary?.trim() ?? "";
  const summaryPlaceholder =
    "Add your professional summary in the Personal Info tab. It will appear here and on your exported PDF.";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerBodyRow}>
          <View style={styles.orangeRail} />
          <View style={styles.headerBodyColumn}>
            <View style={styles.header}>
              <View>
                <Text style={styles.employeeName}>{employee.displayName}</Text>
                {profile?.jobTitle ? (
                  <Text style={styles.employeeTitle}>{profile.jobTitle}</Text>
                ) : null}
              </View>
              <Image style={styles.logo} src={logoPath} />
            </View>

            <View style={styles.body}>
              <View style={styles.leftColumn}>
            <LeftSectionTitle first>Professional Summary</LeftSectionTitle>
            <Text
              style={summaryRaw ? styles.bodyText : styles.bodyTextPlaceholder}
            >
              {summaryRaw || summaryPlaceholder}
            </Text>

            {education.length > 0 ? (
              <>
                <LeftSectionTitle>Education</LeftSectionTitle>
                {education.map((e) => {
                  const years =
                    e.startYear != null && (e.endYear != null || e.isOngoing)
                      ? `${e.startYear} — ${e.isOngoing ? "Present" : e.endYear}`
                      : e.endYear != null
                        ? String(e.endYear)
                        : null;
                  const degreeWithMajor = e.degreeType
                    ? `${e.degreeType} in ${e.degree}`
                    : e.degree;
                  const degreeLine = [degreeWithMajor, e.specialization]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <View key={e.id} style={styles.entryContainer}>
                      <View style={styles.entryHeader}>
                        <Text style={styles.institutionText}>
                          {e.institutionName}
                        </Text>
                        {years ? (
                          <Text style={styles.entryDate}>{years}</Text>
                        ) : null}
                      </View>
                      {degreeLine ? (
                        <Text style={styles.degreeText}>{degreeLine}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </>
            ) : null}

            {skills.length > 0 ? (
              <>
                <LeftSectionTitle>Expertise</LeftSectionTitle>
                {skills.map((s) => (
                  <View key={s.id} style={styles.skillRow}>
                    <Text style={styles.skillName}>{s.skillName}</Text>
                    <View style={styles.skillBarTrack}>
                      <View
                        style={{
                          ...styles.skillBarFill,
                          width: PROFICIENCY_WIDTH[s.proficiencyLevel],
                        }}
                      />
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            {licenses.length > 0 ? (
              <>
                <LeftSectionTitle>Licenses</LeftSectionTitle>
                {licenses.map((lic) => {
                  const label = [lic.licenseType, lic.jurisdiction, lic.status]
                    .filter(Boolean)
                    .join(" | ");
                  return (
                    <View key={lic.id} style={styles.entryContainer}>
                      <Text style={{ ...styles.institutionText, fontSize: 10 }}>{label}</Text>
                      {lic.licenseNumber ? (
                        <Text style={{ ...styles.degreeText, fontSize: 9 }}>No. {lic.licenseNumber}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </>
            ) : null}

            {achievements.length > 0 ? (
              <>
                <LeftSectionTitle>Achievements</LeftSectionTitle>
                {achievements.map((ach) => (
                  <View key={ach.id} style={styles.entryContainer}>
                    <Text style={{ ...styles.institutionText, fontSize: 10 }}>
                      {ach.year ? `${ach.year} | ` : ""}{ach.title}
                    </Text>
                    {ach.organization ? (
                      <Text style={{ ...styles.degreeText, fontSize: 9 }}>{ach.organization}</Text>
                    ) : null}
                  </View>
                ))}
              </>
            ) : null}

            <View style={styles.leftColumnSpacer} />
          </View>

          <View style={styles.rightColumn}>
            {workExperiences.length > 0 ? (
              <>
                <RightSectionTitle>Professional Experience</RightSectionTitle>
                {workExperiences.map((w) => {
                  const dateRange = formatDateRange(
                    w.startDate,
                    w.endDate,
                    w.isCurrent,
                  );
                  const companyLine = [w.companyName, w.location]
                    .filter(Boolean)
                    .join(" | ");
                  const descLines = w.description
                    ? w.description.split("\n").filter((l) => l.trim())
                    : [];
                  return (
                    <View key={w.id} style={styles.entryContainer}>
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryTitle}>{w.jobTitle}</Text>
                        {dateRange ? (
                          <Text style={styles.entryDate}>{dateRange}</Text>
                        ) : null}
                      </View>
                      {companyLine ? (
                        <Text style={styles.entryCompany}>{companyLine}</Text>
                      ) : null}
                      {descLines.map((line, i) => (
                        <BulletItem key={`${w.id}-${i}`} text={line} />
                      ))}
                    </View>
                  );
                })}
              </>
            ) : null}

            {sidebarCerts.length > 0 ? (
              <>
                <RightSectionTitle>Certifications</RightSectionTitle>
                {sidebarCerts.map((c) => {
                  const label = c.issuingOrganization
                    ? `${c.certificationName} — ${c.issuingOrganization}`
                    : c.certificationName;
                  return <ListItem key={c.id} text={label} />;
                })}
              </>
            ) : null}

            {peFeCerts.length > 0 ? (
              <>
                <RightSectionTitle>PE/FE Certifications</RightSectionTitle>
                {peFeCerts.map((c) => {
                  const label = c.issuingOrganization
                    ? `${c.certificationName} — ${c.issuingOrganization}`
                    : c.certificationName;
                  return <ListItem key={`pe-${c.id}`} text={label} />;
                })}
              </>
            ) : null}
          </View>
            </View>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerOrangeRail} />
          <View style={styles.footerInner}>
            <View style={styles.footerSidebarFoot} wrap={false}>
              <Text style={styles.footerBrandLine}>
                <Text style={styles.brandBe}>BE</Text>
                <Text style={styles.brandOn}> On.</Text>
              </Text>
              <Text style={{ ...styles.brandUrl, ...styles.footerBrandLine }}>
                brindleyengineering.com
              </Text>
            </View>
            <View style={styles.footerMainOrange}>
              <View style={styles.footerContactCol}>
                <Text style={styles.footerLabel}>Contact</Text>
                {phone ? <Text style={styles.footerText}>{phone}</Text> : null}
                <Text style={styles.footerText}>{email}</Text>
              </View>
              <View style={styles.footerRight}>
                <Text style={styles.footerNote}>
                  Detailed project history{"\n"}available in the attached{"\n"}
                  Project List
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* ─── PAGE 2 (Independent Shell) ─── */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerBodyRow}>
          <View style={styles.orangeRail} />
          <View style={styles.headerBodyColumn}>
            {/* Page 2 Header (Same layout, no logo) */}
            <View style={styles.header}>
              <View>
                <Text style={styles.employeeName}>{employee.displayName}</Text>
                {profile?.jobTitle ? (
                  <Text style={styles.employeeTitle}>{profile.jobTitle}</Text>
                ) : null}
              </View>
            </View>

            {/* Page 2 Body (Full Width) */}
            <View style={styles.pageTwoMain}>
              {projects.length > 0 ? (
                <>
                  <RightSectionTitle>
                    Project List
                  </RightSectionTitle>

                  {/* ── Per-project tables ── */}
                  {projects.map((p, idx) => {
                    const desc = (p.description ?? "").trim();
                    return (
                      <View key={p.id} style={{ marginBottom: idx < projects.length - 1 ? 12 : 2 }} wrap={false}>
                        {/* Table Container */}
                        <View style={{ borderWidth: 1, borderColor: RULE_GRAY }}>
                          
                          {/* Header Row */}
                          <View style={{ flexDirection: "row", backgroundColor: "#FAFAFA", borderBottomWidth: 1, borderColor: RULE_GRAY }}>
                            <View style={{ flex: 17, paddingVertical: 1.5, paddingHorizontal: 3, borderRightWidth: 1, borderColor: RULE_GRAY }}>
                              <Text style={{ ...pdfFont.bold(), fontSize: 9, color: DARK }}>Industry</Text>
                            </View>
                            <View style={{ flex: 30, paddingVertical: 1.5, paddingHorizontal: 3, borderRightWidth: 1, borderColor: RULE_GRAY }}>
                              <Text style={{ ...pdfFont.bold(), fontSize: 9, color: DARK }}>Project</Text>
                            </View>
                            <View style={{ flex: 22, paddingVertical: 1.5, paddingHorizontal: 3, borderRightWidth: 1, borderColor: RULE_GRAY }}>
                              <Text style={{ ...pdfFont.bold(), fontSize: 9, color: DARK }}>Role</Text>
                            </View>
                            <View style={{ flex: 18, paddingVertical: 1.5, paddingHorizontal: 3, borderRightWidth: 1, borderColor: RULE_GRAY }}>
                              <Text style={{ ...pdfFont.bold(), fontSize: 9, color: DARK }}>Value</Text>
                            </View>
                            <View style={{ flex: 13, paddingVertical: 1.5, paddingHorizontal: 3 }}>
                              <Text style={{ ...pdfFont.bold(), fontSize: 9, color: DARK }}>Year</Text>
                            </View>
                          </View>

                          {/* Data Row */}
                          <View style={{ flexDirection: "row" }}>
                            <View style={{ flex: 17, paddingVertical: 1.5, paddingHorizontal: 3, borderRightWidth: 1, borderColor: RULE_GRAY }}>
                              <Text style={{ ...pdfFont.regular(), fontSize: 9.5, color: DARK }}>{p.industry ?? ""}</Text>
                            </View>
                            <View style={{ flex: 30, paddingVertical: 1.5, paddingHorizontal: 3, borderRightWidth: 1, borderColor: RULE_GRAY }}>
                              <Text style={{ ...pdfFont.regular(), fontSize: 9.5, color: DARK }}>{p.projectName}</Text>
                            </View>
                            <View style={{ flex: 22, paddingVertical: 1.5, paddingHorizontal: 3, borderRightWidth: 1, borderColor: RULE_GRAY }}>
                              <Text style={{ ...pdfFont.regular(), fontSize: 9.5, color: DARK }}>{p.role ?? ""}</Text>
                            </View>
                            <View style={{ flex: 18, paddingVertical: 1.5, paddingHorizontal: 3, borderRightWidth: 1, borderColor: RULE_GRAY }}>
                              <Text style={{ ...pdfFont.regular(), fontSize: 9.5, color: DARK }}>{p.projectValue ?? ""}</Text>
                            </View>
                            <View style={{ flex: 13, paddingVertical: 1.5, paddingHorizontal: 3 }}>
                              <Text style={{ ...pdfFont.regular(), fontSize: 9.5, color: DARK }}>{p.year?.toString() ?? ""}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Expanded title */}
                        {p.expandedTitle ? (
                          <Text style={{ ...pdfFont.bold(), fontSize: 9.5, color: DARK, marginTop: 4, marginBottom: 1 }}>
                            {p.expandedTitle}
                          </Text>
                        ) : null}

                        {/* Description paragraph */}
                        {desc ? (
                          <Text style={{ ...pdfFont.regular(), fontSize: 9, color: GRAY, lineHeight: 1.4, textAlign: "justify" }}>
                            {desc}
                          </Text>
                        ) : null}

                        {/* Divider between projects */}
                        {idx < projects.length - 1 && (
                          <View style={{ height: 0.5, backgroundColor: RULE_GRAY, marginTop: 10 }} />
                        )}
                      </View>
                    );
                  })}
                </>
              ) : null}
            </View>

          </View>
        </View>

        {/* Page 2 Footer (Minimalist) */}
        <View style={styles.footerRow}>
          <View style={styles.footerOrangeRail} />
          <View style={styles.footerInner}>
            {/* Minimalist footer for Page 2 — no branding or legends */}
          </View>
        </View>
      </Page>
    </Document>
  );
}
