import { Document, Page, Text, View, StyleSheet, Image, pdf, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import logo from "@/assets/logo.png";
import seal from "@/assets/seal.jpg";
import msme from "@/assets/msme.png";
import sigFounder from "@/assets/sig-founder.jpg";
import sigCofounder from "@/assets/sig-cofounder.jpg";
import { COMPANY, durationConfig } from "@/lib/constants";

const C = { brand: "#07284a", ink: "#1e293b", muted: "#64748b", border: "#e2e8f0", light: "#f8fafc" };

const s = StyleSheet.create({
  page: { padding: 24, fontSize: 9, color: C.ink, fontFamily: "Helvetica", position: "relative" },

  frameOuter: { position: "absolute", top: 6, left: 6, right: 6, bottom: 6, borderWidth: 1.5, borderColor: C.brand, borderRadius: 4 },
  frameInner: { position: "absolute", top: 10, left: 10, right: 10, bottom: 10, borderWidth: 0.5, borderColor: C.brand, opacity: 0.1 },

  watermark: { position: "absolute", top: 120, left: 0, right: 0, alignItems: "center", opacity: 0.015 },

  topBand: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: C.brand },
  bottomBand: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: C.brand, opacity: 0.6 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 12, marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: C.brand },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { fontSize: 15, fontWeight: 700, color: C.brand, letterSpacing: 0.8 },
  headerSmall: { fontSize: 6.5, color: C.muted, marginTop: 1 },
  small: { fontSize: 6.5, color: C.muted },
  refBox: { alignItems: "flex-end" },
  refLabel: { fontSize: 6, color: C.muted, marginBottom: 1, letterSpacing: 1.2, textTransform: "uppercase" },
  refValue: { fontSize: 8.5, fontWeight: 700, color: C.brand },

  dateLine: { fontSize: 8.5, color: C.ink, marginBottom: 6 },

  title: { fontSize: 20, fontWeight: 700, color: C.brand, marginBottom: 4, letterSpacing: 2 },
  titleAccent: { width: 40, height: 2.5, backgroundColor: C.brand, marginBottom: 10, borderRadius: 2 },

  greeting: { fontSize: 9.5, marginBottom: 6, color: C.ink },
  p: { lineHeight: 1.5, marginBottom: 6, color: "#334155", fontSize: 8.5 },
  bold: { fontWeight: 700 },

  sectionHeading: { fontSize: 10.5, fontWeight: 700, color: C.brand, marginBottom: 5, marginTop: 8, letterSpacing: 0.4 },

  table: { marginBottom: 5, borderWidth: 0.5, borderColor: C.border, borderRadius: 3, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: C.brand },
  th: { fontSize: 7.5, fontWeight: 700, color: "#ffffff", paddingVertical: 3, paddingHorizontal: 8 },
  thKey: { width: 100, paddingHorizontal: 8 },
  thVal: { flex: 1, paddingHorizontal: 8 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: "#ffffff" },
  rowAlt: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: "#f8fafc" },
  rowLast: { flexDirection: "row", backgroundColor: "#f8fafc" },
  key: { width: 100, fontSize: 7.5, color: C.muted, paddingVertical: 3, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: C.border, backgroundColor: "#f1f5f9" },
  val: { flex: 1, fontSize: 8, fontWeight: 700, paddingVertical: 3, paddingHorizontal: 8 },

  overviewBullet: { flexDirection: "row", marginBottom: 2 },
  overviewDot: { width: 14, fontSize: 8, color: C.brand, fontFamily: "Helvetica-Bold", lineHeight: 1.5 },
  overviewText: { flex: 1, fontSize: 8, color: "#334155", lineHeight: 1.5 },

  termsBullet: { flexDirection: "row", marginBottom: 2 },
  termsDot: { width: 14, fontSize: 8, color: C.brand, fontFamily: "Helvetica-Bold" },
  termsText: { flex: 1, fontSize: 8, color: "#475569", lineHeight: 1.45 },

  sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  sigBlock: { alignItems: "center", width: 130 },
  sigImg: { height: 24, marginBottom: 2 },
  sigLine: { borderTopWidth: 0.5, borderTopColor: C.ink, width: "100%", marginBottom: 2 },

  footer: { position: "absolute", bottom: 10, left: 24, right: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 5 },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerText: { fontSize: 6.5, color: C.muted },
  footerRight: { alignItems: "flex-end", gap: 1 },
});

export function OfferLetterDoc({ fullName, internId, domain, issuedAt, duration = 1 }: {
  fullName: string; internId: string; domain: string; issuedAt: string; duration?: number;
}) {
  const date = new Date(issuedAt);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const domainName = domain.charAt(0).toUpperCase() + domain.slice(1);
  const dur = durationConfig(duration);
  const durLabel = dur?.label ?? "1 Month";

  const endDate = new Date(date);
  if (duration > 1) endDate.setMonth(endDate.getMonth() + duration);
  else endDate.setMonth(endDate.getMonth() + 1);
  const endDateStr = endDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.frameOuter} />
        <View style={s.frameInner} />

        <View style={s.watermark}>
          <Text style={{ fontSize: 64, color: C.brand, fontFamily: "Helvetica-Bold", letterSpacing: 8 }}>SKYROVIX</Text>
        </View>

        <View style={s.topBand} />
        <View style={s.bottomBand} />

        <View style={s.header}>
          <View style={s.headerLeft}>
            <Image src={logo} style={{ width: 30, height: 30 }} />
            <View>
              <Text style={s.brand}>{COMPANY.name}</Text>
              <Text style={s.headerSmall}>{COMPANY.tagline} · {COMPANY.website} · {COMPANY.email}</Text>
            </View>
          </View>
          <View style={s.refBox}>
            <Text style={s.refLabel}>INTERN ID</Text>
            <Text style={s.refValue}>{internId}</Text>
            <Text style={[s.refLabel, { marginTop: 4 }]}>ISSUE DATE</Text>
            <Text style={s.refValue}>{dateStr}</Text>
          </View>
        </View>

        <Text style={s.title}>INTERNSHIP OFFER LETTER</Text>
        <View style={s.titleAccent} />

        <Text style={s.dateLine}>Date: {dateStr}</Text>

        <Text style={s.greeting}>Dear <Text style={s.bold}>{fullName}</Text>,</Text>

        <Text style={s.p}>
          We are delighted to offer you the position of <Text style={s.bold}>Virtual Intern – {domainName}</Text> at <Text style={s.bold}>Skyrovix</Text>.
        </Text>

        <Text style={s.p}>
          After reviewing your profile, we are confident that your skills and enthusiasm make you a valuable addition to our team. We look forward to supporting your professional growth through this internship opportunity.
        </Text>

        <Text style={s.sectionHeading}>Internship Details</Text>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.th, s.thKey]}>Particulars</Text>
            <Text style={[s.th, s.thVal]}>Details</Text>
          </View>
          <View style={s.row}>
            <Text style={s.key}>Full Name</Text>
            <Text style={s.val}>{fullName}</Text>
          </View>
          <View style={s.rowAlt}>
            <Text style={s.key}>Intern ID</Text>
            <Text style={s.val}>{internId}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.key}>Domain</Text>
            <Text style={s.val}>{domainName}</Text>
          </View>
          <View style={s.rowAlt}>
            <Text style={s.key}>Duration</Text>
            <Text style={s.val}>{durLabel}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.key}>Start Date</Text>
            <Text style={s.val}>{dateStr}</Text>
          </View>
          <View style={s.rowAlt}>
            <Text style={s.key}>End Date</Text>
            <Text style={s.val}>{endDateStr}</Text>
          </View>
          <View style={s.rowLast}>
            <Text style={s.key}>Mode of Internship</Text>
            <Text style={s.val}>Remote / Virtual</Text>
          </View>
        </View>

        <Text style={s.sectionHeading}>Internship Overview</Text>

        <Text style={s.p}>
          During this internship, you will have the opportunity to:
        </Text>

        <View>
          <View style={s.overviewBullet}>
            <Text style={s.overviewDot}>•</Text>
            <Text style={s.overviewText}>Work on practical, real-world <Text style={s.bold}>{domainName}</Text> projects.</Text>
          </View>
          <View style={s.overviewBullet}>
            <Text style={s.overviewDot}>•</Text>
            <Text style={s.overviewText}>Gain hands-on experience with modern development tools and technologies.</Text>
          </View>
          <View style={s.overviewBullet}>
            <Text style={s.overviewDot}>•</Text>
            <Text style={s.overviewText}>Receive mentorship and guidance from experienced professionals.</Text>
          </View>
          <View style={s.overviewBullet}>
            <Text style={s.overviewDot}>•</Text>
            <Text style={s.overviewText}>Enhance your technical and problem-solving skills through project-based learning.</Text>
          </View>
          <View style={s.overviewBullet}>
            <Text style={s.overviewDot}>•</Text>
            <Text style={s.overviewText}>Participate in periodic progress reviews and feedback sessions.</Text>
          </View>
        </View>

        <Text style={s.sectionHeading}>Certificate of Completion</Text>

        <Text style={s.p}>
          Upon successful completion of the internship and fulfillment of all assigned tasks, you will receive a <Text style={s.bold}>Certificate of Internship</Text> with QR-code verification for authenticity.
        </Text>

        <Text style={s.sectionHeading}>Terms & Conditions</Text>

        <View>
          <View style={s.termsBullet}>
            <Text style={s.termsDot}>•</Text>
            <Text style={s.termsText}>This internship is conducted remotely and offers flexible working hours.</Text>
          </View>
          <View style={s.termsBullet}>
            <Text style={s.termsDot}>•</Text>
            <Text style={s.termsText}>Interns are expected to maintain regular communication and submit assigned work within deadlines.</Text>
          </View>
          <View style={s.termsBullet}>
            <Text style={s.termsDot}>•</Text>
            <Text style={s.termsText}>Successful completion will be determined based on performance, project submission, and adherence to internship guidelines.</Text>
          </View>
        </View>

        <Text style={s.p}>
          We are excited to have you join our team and wish you a rewarding learning experience with Skyrovix.
        </Text>

        <Text style={[s.p, { marginTop: 1 }]}>
          <Text style={s.bold}>Congratulations and Welcome to the Team!</Text>
        </Text>

        <View style={s.sigRow}>
          <View style={s.sigBlock}>
            <Image src={sigFounder} style={s.sigImg} />
            <View style={s.sigLine} />
            <Text style={s.bold}>{COMPANY.founder.name}</Text>
            <Text style={{ fontSize: 6.5, color: C.muted }}>{COMPANY.founder.title}</Text>
          </View>
          <View style={s.sigBlock}>
            <Image src={seal} style={{ width: 44, height: 44, opacity: 0.7 }} />
            <Text style={{ fontSize: 6, color: C.muted, marginTop: 1 }}>Company Seal</Text>
          </View>
          <View style={s.sigBlock}>
            <Image src={sigCofounder} style={s.sigImg} />
            <View style={s.sigLine} />
            <Text style={s.bold}>{COMPANY.cofounder.name}</Text>
            <Text style={{ fontSize: 6.5, color: C.muted }}>{COMPANY.cofounder.title}</Text>
          </View>
        </View>

        <View style={s.footer}>
          <View style={s.footerLeft}>
            <Image src={msme} style={{ width: 76, height: 30 }} />
            <Text style={s.footerText}>MSME: UDYAM-TN-17-0076606</Text>
          </View>
          <View style={s.footerRight}>
            <Text style={s.footerText}>{COMPANY.email} | {COMPANY.website}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function CertificateDoc({ fullName, internId, domain, certId, issuedAt, verifyUrl }: {
  fullName: string; internId: string; domain: string; certId: string; issuedAt: string; verifyUrl: string;
}) {
  const date = new Date(issuedAt);
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={{ ...s.page, padding: 28 }}>
        <View style={{ borderWidth: 6, borderColor: C.brand, padding: 24, height: "100%" }}>
          <View style={{ borderWidth: 1, borderColor: C.border, padding: 24, height: "100%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Image src={logo} style={{ width: 56, height: 56 }} />
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: C.muted, letterSpacing: 4 }}>SKYROVIX IT SOLUTIONS</Text>
                <Text style={{ fontSize: 10, color: C.muted }}>{COMPANY.tagline}</Text>
              </View>
              <Image src={msme} style={{ height: 40 }} />
            </View>

            <View style={{ alignItems: "center", marginTop: 18 }}>
              <Text style={{ fontSize: 36, fontWeight: 700, color: C.brand, letterSpacing: 4 }}>CERTIFICATE</Text>
              <Text style={{ fontSize: 12, color: C.muted, letterSpacing: 8, marginTop: 2 }}>OF INTERNSHIP COMPLETION</Text>
            </View>

            <View style={{ alignItems: "center", marginTop: 28 }}>
              <Text style={{ fontSize: 11, color: C.muted }}>This certificate is proudly presented to</Text>
              <Text style={{ fontSize: 32, fontWeight: 700, marginTop: 12, marginBottom: 12, color: C.ink }}>{fullName}</Text>
              <Text style={{ fontSize: 11, color: C.muted, textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
                for successfully completing the task-based virtual internship program in
                {" "}<Text style={{ fontWeight: 700, color: C.ink }}>{domain}</Text>{" "}
                at Skyrovix IT Solutions, demonstrating dedication, technical skill, and professional excellence throughout the program.
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 40 }}>
              <View style={s.sigBlock}>
                <Image src={sigFounder} style={s.sigImg} />
                <View style={s.sigLine} />
                <Text style={s.bold}>{COMPANY.founder.name}</Text>
                <Text style={s.small}>{COMPANY.founder.title}</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Image src={seal} style={{ width: 90, height: 90, opacity: 0.9 }} />
              </View>
              <View style={s.sigBlock}>
                <Image src={sigCofounder} style={s.sigImg} />
                <View style={s.sigLine} />
                <Text style={s.bold}>{COMPANY.cofounder.name}</Text>
                <Text style={s.small}>{COMPANY.cofounder.title}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, fontSize: 9, color: C.muted }}>
              <Text>Certificate ID: {certId}</Text>
              <Text>Intern ID: {internId}</Text>
              <Text>Issued: {date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</Text>
            </View>
            <Text style={{ fontSize: 8, color: C.muted, marginTop: 4, textAlign: "center" }}>Verify at: {verifyUrl}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function CourseCertificateDoc({ fullName, courseName, score, total, certId, issuedAt, verifyUrl }: {
  fullName: string; courseName: string; score: number; total: number;
  certId: string; issuedAt: string; verifyUrl: string;
}) {
  const date = new Date(issuedAt);
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={{ ...s.page, padding: 28 }}>
        <View style={{ borderWidth: 6, borderColor: C.brand, padding: 24, height: "100%" }}>
          <View style={{ borderWidth: 1, borderColor: C.border, padding: 24, height: "100%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Image src={logo} style={{ width: 56, height: 56 }} />
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: C.muted, letterSpacing: 4 }}>SKYROVIX IT SOLUTIONS</Text>
                <Text style={{ fontSize: 10, color: C.muted }}>{COMPANY.tagline}</Text>
              </View>
              <Image src={msme} style={{ height: 40 }} />
            </View>

            <View style={{ alignItems: "center", marginTop: 18 }}>
              <Text style={{ fontSize: 36, fontWeight: 700, color: C.brand, letterSpacing: 4 }}>COURSE CERTIFICATE</Text>
              <Text style={{ fontSize: 12, color: C.muted, letterSpacing: 8, marginTop: 2 }}>OF COMPLETION</Text>
            </View>

            <View style={{ alignItems: "center", marginTop: 28 }}>
              <Text style={{ fontSize: 11, color: C.muted }}>This certificate is awarded to</Text>
              <Text style={{ fontSize: 32, fontWeight: 700, marginTop: 12, marginBottom: 12, color: C.ink }}>{fullName}</Text>
              <Text style={{ fontSize: 11, color: C.muted, textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
                for successfully completing the {" "}
                <Text style={{ fontWeight: 700, color: C.ink }}>{courseName}</Text>{" "}
                course with a score of <Text style={{ fontWeight: 700, color: C.ink }}>{score}/{total}</Text>,
                demonstrating proficiency and commitment to learning.
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 40 }}>
              <View style={s.sigBlock}>
                <Image src={sigFounder} style={s.sigImg} />
                <View style={s.sigLine} />
                <Text style={s.bold}>{COMPANY.founder.name}</Text>
                <Text style={s.small}>{COMPANY.founder.title}</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Image src={seal} style={{ width: 90, height: 90, opacity: 0.9 }} />
              </View>
              <View style={s.sigBlock}>
                <Image src={sigCofounder} style={s.sigImg} />
                <View style={s.sigLine} />
                <Text style={s.bold}>{COMPANY.cofounder.name}</Text>
                <Text style={s.small}>{COMPANY.cofounder.title}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, fontSize: 9, color: C.muted }}>
              <Text>Certificate ID: {certId}</Text>
              <Text>Score: {score}/{total}</Text>
              <Text>Issued: {date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</Text>
            </View>
            <Text style={{ fontSize: 8, color: C.muted, marginTop: 4, textAlign: "center" }}>Verify at: {verifyUrl}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadPdf(doc: ReactElement<DocumentProps>, filename: string) {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPdfBlob(doc: ReactElement<DocumentProps>): Promise<Blob> {
  return pdf(doc).toBlob();
}
