import { createServerFn } from "@tanstack/react-start";

type SendEmailInput = {
  to: string;
  studentName: string;
  studentId: string;
  documentType: "offer_letter" | "certificate";
  subject: string;
  body: string;
  referenceId?: string;
  pdfData: {
    fullName: string;
    internId: string;
    domain: string;
    issuedAt: string;
    duration?: number;
    certId?: string;
    verifyUrl?: string;
  };
};

type EmailResult = {
  success: boolean;
  logId: string;
  error?: string;
};

export const sendEmail = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data }): Promise<EmailResult> => {
    console.log("[Email] ===== sendEmail handler invoked =====");

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || "noreply@skyrovix.online";

    console.log("[Email] SMTP host:", smtpHost, "user:", smtpUser);

    let status: "sent" | "failed" = "failed";
    let errorMessage: string | undefined;
    let logId = "";

    if (!data) {
      errorMessage = "No data received in handler";
      console.error("[Email] " + errorMessage);
      return { success: false, logId: "", error: errorMessage };
    }

    const { to, studentName, studentId, documentType, subject, body, referenceId, pdfData } = data as SendEmailInput;

    console.log("[Email] To:", to, "DocType:", documentType, "Subject:", subject);

    if (!smtpHost || !smtpUser || !smtpPass) {
      errorMessage = "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env";
      console.error("[Email] " + errorMessage);
      await logToDb(studentId, to, studentName, documentType, status, subject, referenceId, errorMessage);
      return { success: false, logId, error: errorMessage };
    }

    const { default: nodemailer } = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    console.log("[Email] Step 1: Verifying SMTP connection...");
    try {
      await transporter.verify();
      console.log("[Email] Step 1: SMTP Connected Successfully");
    } catch (verifyErr: any) {
      errorMessage = `SMTP verify failed: ${verifyErr?.message ?? verifyErr}`;
      console.error("[Email] Step 1 FAILED:", errorMessage);
      await logToDb(studentId, to, studentName, documentType, status, subject, referenceId, errorMessage);
      return { success: false, logId, error: errorMessage };
    }

    console.log("[Email] Step 2: Loading assets for PDF...");
    const imageAssets: Record<string, string> = {};
    try {
      const fs = await import("fs");
      const nodePath = await import("path");
      const assetDir = nodePath.join(process.cwd(), "src", "assets");
      const images: { key: string; file: string; mime: string }[] = [
        { key: "logo", file: "logo.png", mime: "image/png" },
        { key: "seal", file: "seal.jpg", mime: "image/jpeg" },
        { key: "msme", file: "msme.png", mime: "image/png" },
        { key: "sigFounder", file: "sig-founder.jpg", mime: "image/jpeg" },
        { key: "sigCofounder", file: "sig-cofounder.jpg", mime: "image/jpeg" },
      ];
      for (const img of images) {
        const imgPath = nodePath.join(assetDir, img.file);
        if (fs.existsSync(imgPath)) {
          const buffer = fs.readFileSync(imgPath);
          const dataUri = `data:${img.mime};base64,${buffer.toString("base64")}`;
          imageAssets[img.key] = dataUri;
          console.log(`[Email] Asset loaded: ${img.file} (${buffer.length} bytes)`);
        }
      }
    } catch (assetErr: any) {
      console.warn("[Email] Assets not available, skipping:", assetErr?.message);
    }

    console.log("[Email] Step 3: Generating QR code...");
    let qrCodeDataUri: string | undefined;
    const verifyUrl = pdfData.verifyUrl;
    if (verifyUrl) {
      try {
        const QRCode = await import("qrcode");
        qrCodeDataUri = await QRCode.toDataURL(verifyUrl, { width: 140, margin: 1, color: { dark: "#07284a", light: "#ffffff" } });
        console.log("[Email] QR code generated for:", verifyUrl);
      } catch (qrErr: any) {
        console.warn("[Email] QR generation failed, skipping:", qrErr?.message);
      }
    }

    console.log("[Email] Step 4: Generating PDF...");
    let pdfBuffer: Buffer | null = null;
    try {
      const ReactPdf = await import("@react-pdf/renderer");
      const React = await import("react");
      const PdfDocs = await import("@/components/pdf-docs");

      const docEl = documentType === "offer_letter"
        ? React.createElement(PdfDocs.OfferLetterDoc, {
            fullName: pdfData.fullName,
            internId: pdfData.internId,
            domain: pdfData.domain,
            issuedAt: pdfData.issuedAt,
            duration: pdfData.duration ?? 1,
            verifyUrl,
            qrCodeDataUri,
            imageAssets,
          })
        : React.createElement(PdfDocs.CertificateDoc, {
            fullName: pdfData.fullName,
            internId: pdfData.internId,
            domain: pdfData.domain,
            certId: pdfData.certId ?? referenceId ?? "",
            issuedAt: pdfData.issuedAt,
            verifyUrl: verifyUrl ?? "",
            qrCodeDataUri,
            imageAssets,
          });

      const blob = await ReactPdf.pdf(docEl).toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
      console.log("[Email] PDF generated:", pdfBuffer.length, "bytes");
    } catch (pdfErr: any) {
      errorMessage = `PDF generation failed: ${pdfErr?.message ?? pdfErr}`;
      console.error("[Email] Step 4 FAILED:", errorMessage);
      await logToDb(studentId, to, studentName, documentType, status, subject, referenceId, errorMessage);
      return { success: false, logId, error: errorMessage };
    }

    const filename = documentType === "offer_letter"
      ? `Offer_Letter_${studentId}.pdf`
      : `Certificate_${referenceId ?? studentId}.pdf`;

    console.log("[Email] Step 5: Sending email via sendMail...");
    console.log("[Email] To:", to);
    console.log("[Email] Subject:", subject);

    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        text: body,
        attachments: [
          {
            filename,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      console.log("[Email] Step 5: sendMail succeeded");
      console.log("[Email] messageId:", info.messageId);
      console.log("[Email] accepted:", JSON.stringify(info.accepted));
      console.log("[Email] rejected:", JSON.stringify(info.rejected));
      console.log("[Email] response:", info.response);

      status = "sent";
      errorMessage = undefined;
    } catch (sendErr: any) {
      status = "failed";
      errorMessage = `sendMail failed: ${sendErr?.message ?? sendErr}`;
      console.error("[Email] Step 5 FAILED:", errorMessage);
      console.error("[Email] sendErr.code:", sendErr?.code);
      console.error("[Email] sendErr.errno:", sendErr?.errno);
      console.error("[Email] sendErr.syscall:", sendErr?.syscall);
      console.error("[Email] sendErr.response:", sendErr?.response);
      console.error("[Email] sendErr.responseCode:", sendErr?.responseCode);
      console.error("[Email] PDF size (KB):", pdfBuffer ? Math.round(pdfBuffer.length / 1024) : 0);
    }

    logId = await logToDb(studentId, to, studentName, documentType, status, subject, referenceId, errorMessage);
    const result: EmailResult = { success: status === "sent", logId, error: errorMessage };
    console.log("[Email] Final result:", JSON.stringify(result));
    return result;
  });

async function logToDb(
  userId: string,
  emailTo: string,
  studentName: string,
  documentType: string,
  status: string,
  subject: string,
  referenceId: string | undefined,
  errorMessage: string | undefined,
): Promise<string> {
  console.log("[Email] Step 4: Logging to email_logs table...");
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: logRow, error: logError } = await supabaseAdmin
      .from("email_logs")
      .insert({
        user_id: userId,
        email_to: emailTo,
        student_name: studentName,
        document_type: documentType,
        status,
        subject,
        reference_id: referenceId,
        error_message: errorMessage,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (logError) {
      console.error("[Email] Step 4 FAILED: DB insert error:", logError);
    } else {
      const id = (logRow as any)?.id ?? "";
      console.log("[Email] Step 4: Logged with id:", id);
      return id;
    }
  } catch (dbErr: any) {
    console.error("[Email] Step 4 FAILED:", dbErr?.message);
  }
  return "";
}
