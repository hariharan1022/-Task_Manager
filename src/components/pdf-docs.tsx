import { Document, Page, Text, View, StyleSheet, Image, pdf, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import logo from "@/assets/logo.jpg";
import seal from "@/assets/seal.jpg";
import msme from "@/assets/msme.png";
import sigFounder from "@/assets/sig-founder.jpg";
import sigCofounder from "@/assets/sig-cofounder.jpg";
import { COMPANY } from "@/lib/constants";

const COLOR = { brand: "#7c3aed", brandDark: "#5b21b6", accent: "#ec4899", ink: "#0f172a", muted: "#64748b", soft: "#f5f3ff", border: "#e2e8f0" };

const s = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, fontSize: 11, color: COLOR.ink, fontFamily: "Helvetica" },
  bandTop: { backgroundColor: COLOR.brand, height: 14 },
  bandAccent: { height: 4, backgroundColor: COLOR.accent },
  body: { paddingHorizontal: 44, paddingTop: 24, paddingBottom: 120 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: COLOR.border },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { fontSize: 16, fontWeight: 700, color: COLOR.brandDark, letterSpacing: 1 },
  small: { fontSize: 9, color: COLOR.muted },
  refBox: { alignItems: "flex-end" },
  refLabel: { fontSize: 8, color: COLOR.muted, letterSpacing: 1 },
  refValue: { fontSize: 10, color: COLOR.ink, fontWeight: 700 },
  titleWrap: { alignItems: "center", marginBottom: 18 },
  titleTag: { fontSize: 8, color: COLOR.accent, letterSpacing: 6, marginBottom: 4 },
  h1: { fontSize: 22, fontWeight: 700, color: COLOR.brandDark, letterSpacing: 2 },
  underline: { width: 60, height: 2, backgroundColor: COLOR.accent, marginTop: 6 },
  greeting: { fontSize: 12, marginBottom: 10 },
  p: { lineHeight: 1.7, marginBottom: 10, fontSize: 11, color: "#334155" },
  bold: { fontWeight: 700, color: COLOR.ink },
  detailsCard: { borderWidth: 1, borderColor: COLOR.border, borderLeftWidth: 3, borderLeftColor: COLOR.brand, backgroundColor: COLOR.soft, padding: 12, borderRadius: 4, marginVertical: 10 },
  detailRow: { flexDirection: "row", marginBottom: 4 },
  detailKey: { width: 110, fontSize: 10, color: COLOR.muted },
  detailVal: { fontSize: 10, color: COLOR.ink, fontWeight: 700 },
  sigRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 30 },
  sigBlock: { width: 170, alignItems: "center" },
  sigImg: { height: 38, marginBottom: 2 },
  sigLine: { borderTopWidth: 1, borderTopColor: COLOR.ink, width: "100%", marginBottom: 4 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  footerInner: { paddingHorizontal: 44, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: COLOR.border, backgroundColor: "#fafafa" },
  footerText: { fontSize: 8, color: COLOR.muted },
});

export function OfferLetterDoc({ fullName, internId, domain, issuedAt }: { fullName: string; internId: string; domain: string; issuedAt: string }) {
  const date = new Date(issuedAt);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.bandTop} />
        <View style={s.bandAccent} />
        <View style={s.body}>
          <View style={s.header}>
            <View style={s.logoRow}>
              <Image src={logo} style={{ width: 48, height: 48 }} />
              <View>
                <Text style={s.brand}>{COMPANY.shortName.toUpperCase()}</Text>
                <Text style={s.small}>{COMPANY.tagline} · MSME Registered</Text>
              </View>
            </View>
            <View style={s.refBox}>
              <Text style={s.refLabel}>REF NO.</Text>
              <Text style={s.refValue}>{internId}</Text>
              <Text style={[s.refLabel, { marginTop: 4 }]}>DATE</Text>
              <Text style={s.refValue}>{dateStr}</Text>
            </View>
          </View>

          <View style={s.titleWrap}>
            <Text style={s.titleTag}>OFFICIAL DOCUMENT</Text>
            <Text style={s.h1}>INTERNSHIP OFFER LETTER</Text>
            <View style={s.underline} />
          </View>

          <Text style={s.greeting}>Dear <Text style={s.bold}>{fullName}</Text>,</Text>
          <Text style={s.p}>
            We are delighted to extend this offer of a <Text style={s.bold}>Virtual Internship</Text> at {COMPANY.name}. After reviewing your application, we are confident your skills, curiosity, and commitment align with our mission to help students build real, industry-grade products.
          </Text>

          <View style={s.detailsCard}>
            <View style={s.detailRow}><Text style={s.detailKey}>Intern Name</Text><Text style={s.detailVal}>{fullName}</Text></View>
            <View style={s.detailRow}><Text style={s.detailKey}>Intern ID</Text><Text style={s.detailVal}>{internId}</Text></View>
            <View style={s.detailRow}><Text style={s.detailKey}>Domain</Text><Text style={s.detailVal}>{domain}</Text></View>
            <View style={s.detailRow}><Text style={s.detailKey}>Mode</Text><Text style={s.detailVal}>Remote / Virtual</Text></View>
            <View style={s.detailRow}><Text style={s.detailKey}>Duration</Text><Text style={s.detailVal}>Self-paced (2–6 weeks)</Text></View>
            <View style={s.detailRow}><Text style={s.detailKey}>Start Date</Text><Text style={s.detailVal}>{dateStr}</Text></View>
          </View>

          <Text style={s.p}>
            During the program you will complete <Text style={s.bold}>5 progressive, mentor-reviewed tasks</Text> designed to build portfolio-grade experience. Each task you submit will be reviewed by our team, and you will receive constructive feedback to help you grow.
          </Text>
          <Text style={s.p}>
            Upon successful completion of all tasks, you will be awarded a <Text style={s.bold}>QR-verified Certificate of Internship</Text> bearing your unique Intern ID and a publicly verifiable certificate ID.
          </Text>
          <Text style={s.p}>
            We are excited to have you on board. Welcome to the {COMPANY.shortName} family — let's build something remarkable together.
          </Text>

          <View style={s.sigRow}>
            <View style={s.sigBlock}>
              <Image src={sigFounder} style={s.sigImg} />
              <View style={s.sigLine} />
              <Text style={s.bold}>{COMPANY.founder.name}</Text>
              <Text style={s.small}>{COMPANY.founder.title}</Text>
            </View>
            <View style={s.sigBlock}>
              <Image src={seal} style={{ width: 84, height: 84, opacity: 0.9 }} />
            </View>
            <View style={s.sigBlock}>
              <Image src={sigCofounder} style={s.sigImg} />
              <View style={s.sigLine} />
              <Text style={s.bold}>{COMPANY.cofounder.name}</Text>
              <Text style={s.small}>{COMPANY.cofounder.title}</Text>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <View style={s.bandAccent} />
          <View style={s.footerInner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Image src={msme} style={{ height: 22 }} />
              <Text style={s.footerText}>UDYAM-TN-17-0076606</Text>
            </View>
            <Text style={s.footerText}>{COMPANY.email}  ·  {COMPANY.website}</Text>
          </View>
          <View style={{ height: 8, backgroundColor: COLOR.brand }} />
        </View>
      </Page>
    </Document>
  );
}

export function CertificateDoc({ fullName, internId, domain, certId, issuedAt, verifyUrl }: { fullName: string; internId: string; domain: string; certId: string; issuedAt: string; verifyUrl: string }) {
  const date = new Date(issuedAt);
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={{ ...s.page, padding: 28 }}>
        <View style={{ borderWidth: 6, borderColor: COLOR.brand, padding: 24, height: "100%" }}>
          <View style={{ borderWidth: 1, borderColor: COLOR.border, padding: 24, height: "100%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Image src={logo} style={{ width: 56, height: 56 }} />
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: COLOR.muted, letterSpacing: 4 }}>SKYROVIX IT SOLUTIONS</Text>
                <Text style={{ fontSize: 10, color: COLOR.muted }}>{COMPANY.tagline}</Text>
              </View>
              <Image src={msme} style={{ height: 40 }} />
            </View>

            <View style={{ alignItems: "center", marginTop: 18 }}>
              <Text style={{ fontSize: 36, fontWeight: 700, color: COLOR.brand, letterSpacing: 4 }}>CERTIFICATE</Text>
              <Text style={{ fontSize: 12, color: COLOR.muted, letterSpacing: 8, marginTop: 2 }}>OF INTERNSHIP COMPLETION</Text>
            </View>

            <View style={{ alignItems: "center", marginTop: 28 }}>
              <Text style={{ fontSize: 11, color: COLOR.muted }}>This certificate is proudly presented to</Text>
              <Text style={{ fontSize: 32, fontWeight: 700, marginTop: 12, marginBottom: 12, color: COLOR.ink }}>{fullName}</Text>
              <Text style={{ fontSize: 11, color: COLOR.muted, textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
                for successfully completing the task-based virtual internship program in
                {" "}<Text style={{ fontWeight: 700, color: COLOR.ink }}>{domain}</Text>{" "}
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

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, fontSize: 9, color: COLOR.muted }}>
              <Text>Certificate ID: {certId}</Text>
              <Text>Intern ID: {internId}</Text>
              <Text>Issued: {date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</Text>
            </View>
            <Text style={{ fontSize: 8, color: COLOR.muted, marginTop: 4, textAlign: "center" }}>Verify at: {verifyUrl}</Text>
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
