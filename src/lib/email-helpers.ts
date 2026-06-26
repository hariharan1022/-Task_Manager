import { sendEmail } from "./email-service";
import { COMPANY, durationConfig } from "./constants";

export async function sendOfferLetterEmail(params: {
  to: string;
  studentName: string;
  studentId: string;
  internId: string;
  domainName: string;
  duration: number;
}) {
  const dur = durationConfig(params.duration);
  const durLabel = dur?.label ?? `${params.duration} Month(s)`;

  const verifyUrl = `https://www.skyrovix.online/verify-certificate`;

  const body = `Dear ${params.studentName},

We are delighted to congratulate you on your successful selection for the ${params.domainName} Internship Program at Skyrovix.

After carefully reviewing your application, we are pleased to confirm that you have been selected to join our internship program. This achievement reflects your potential, enthusiasm, and commitment to learning.

Your Official Internship Offer Letter is attached to this email in PDF format. Kindly download the document and review the internship details, terms, and guidelines carefully before commencing your internship.

Internship Summary

* Domain: ${params.domainName}
* Duration: ${durLabel}
* Mode: Remote / Virtual
* Organization: Skyrovix
* Offer Letter: Attached (PDF)

At Skyrovix, our mission is to provide aspiring professionals with practical industry experience through real-world projects, structured learning, and continuous mentorship. We are excited to have you as part of our growing community and look forward to supporting your professional development throughout this journey.

If you have any questions or require assistance at any stage, please don't hesitate to contact our support team.

Email: support@skyrovix.online
Website: www.skyrovix.online

Once again, congratulations on your achievement. We wish you a successful and rewarding internship experience with Skyrovix.

Warm Regards,

Hariharan S
Founder & CEO
Skyrovix
Empowering Future Professionals Through Industry-Ready Learning
www.skyrovix.online
support@skyrovix.online

---
Note: This is an automated email from Skyrovix. Please do not reply directly to this message. For assistance, kindly contact our support team.`;

  return sendEmail({
    data: {
      to: params.to,
      studentName: params.studentName,
      studentId: params.studentId,
      documentType: "offer_letter",
      subject: `Dear ${params.studentName}, your Skyrovix Internship Offer Letter`,
      body,
      referenceId: params.internId,
      pdfData: {
        fullName: params.studentName,
        internId: params.internId,
        domain: params.domainName,
        issuedAt: new Date().toISOString(),
        duration: params.duration,
        verifyUrl,
      },
    },
  });
}

export async function sendCertificateEmail(params: {
  to: string;
  studentName: string;
  studentId: string;
  certId: string;
  domainName: string;
  internId: string;
}) {
  const verifyUrl = `https://www.skyrovix.online/verify-certificate`;

  return sendEmail({
    data: {
      to: params.to,
      studentName: params.studentName,
      studentId: params.studentId,
      documentType: "certificate",
      subject: `Certificate of Completion - ${COMPANY.name} Internship Program`,
      body: `Dear ${params.studentName},

Congratulations on successfully completing your ${params.domainName} Internship at Skyrovix!

We are proud of your dedication, hard work, and the skills you have developed throughout this program. Your commitment to professional growth and excellence has been truly commendable.

Please find attached your Official Certificate of Completion. You can verify your certificate online at:
${verifyUrl}

Certificate ID: ${params.certId}
Intern ID: ${params.internId}
Domain: ${params.domainName}
Issued by: Skyrovix

As you move forward in your career, we hope the knowledge and experience gained during this internship serve as a strong foundation for your future endeavors.

We would be delighted to stay connected. Feel free to share your achievements and updates with us at support@skyrovix.online.

Best wishes for your future!

Warm Regards,
Hariharan S
Founder & CEO
Skyrovix
www.skyrovix.online
support@skyrovix.online

---
Note: This is an automated email from Skyrovix. Please do not reply directly to this message.`,
      referenceId: params.certId,
      pdfData: {
        fullName: params.studentName,
        internId: params.internId,
        domain: params.domainName,
        issuedAt: new Date().toISOString(),
        certId: params.certId,
        verifyUrl,
      },
    },
  });
}
