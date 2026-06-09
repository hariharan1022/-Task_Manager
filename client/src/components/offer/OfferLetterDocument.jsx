import { assetUrl, verifyPageUrl } from "../../utils/paths.js";
import { COMPANY } from "../../constants/company.js";
import VerifyQRCode from "../common/VerifyQRCode.jsx";
import {
  buildInternId,
  formatLetterDate,
  internshipDates,
  resolveOfferLetterId,
} from "./offerLetterUtils.js";

const TERMS = [
  "The intern shall complete all assigned tasks within the stipulated program duration.",
  "Work submissions must be made through the official SKYROVIX platform only.",
  "The intern agrees to maintain confidentiality of all proprietary materials.",
  "Completion of tasks and mentor approval is required for certificate issuance.",
  "This offer is valid for the duration specified and may be revoked for misconduct.",
  "The intern must share the offer letter on LinkedIn to unlock task assignments.",
];

export default function OfferLetterDocument({ application, internship, studentName }) {
  const issuedOn = new Date();
  const { start, end } = internshipDates(application, internship);
  const internId = buildInternId(application, { _id: application.student });
  const offerLetterId = resolveOfferLetterId(application);
  const roleLabel = internship?.domain || internship?.title || "Internship Program";
  const subjectTitle = internship?.title || roleLabel;
  const mode = application?.internshipMode || COMPANY.workMode;
  const verifyUrl = verifyPageUrl("offer", offerLetterId);

  const details = [
    ["Offer Letter ID", offerLetterId],
    ["Intern ID", internId],
    ["Internship Role", `Intern — ${internship?.title || subjectTitle}`],
    ["Training Domain", roleLabel],
    ["Duration", internship?.duration || "As per program schedule"],
    ["Start Date", formatLetterDate(start)],
    ["End Date", formatLetterDate(end)],
    ["Internship Mode", mode],
  ];

  return (
    <article
      className="relative mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-gray-800 text-[11px] leading-relaxed shadow-xl border border-blue-100 rounded-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none print:min-h-0"
      aria-label="Internship offer letter"
    >
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-800 via-blue-600 to-blue-400" aria-hidden />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden>
        <img src={assetUrl("/skyrovix-logo.png")} alt="" className="w-[75%] max-w-lg object-contain opacity-[0.03] select-none" />
      </div>

      <div className="relative z-[1] pl-9 pr-7 sm:pl-11 sm:pr-9 pt-8 pb-6 print:px-8 print:py-6">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400" />

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b-2 border-blue-100">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
              <img src={assetUrl("/skyrovix-logo.png")} alt={COMPANY.name} className="h-14 w-auto object-contain" />
            </div>
            <div>
              <p className="text-lg font-bold text-blue-900 tracking-tight">{COMPANY.name}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-blue-500">{COMPANY.tagline}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{COMPANY.subtitle}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-right text-[10px] text-gray-500 leading-relaxed">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Official Offer Letter</p>
              <p className="mt-1 font-mono text-[9px] text-blue-700 font-semibold">{offerLetterId}</p>
              <p className="mt-1">Date: <span className="font-semibold text-gray-700">{formatLetterDate(issuedOn)}</span></p>
              <p className="mt-0.5">
                <a href={COMPANY.website} className="text-blue-600 hover:underline">{COMPANY.websiteDisplay}</a>
              </p>
              <p><a href={`mailto:${COMPANY.email}`} className="text-blue-600 hover:underline">{COMPANY.email}</a></p>
            </div>
            <VerifyQRCode value={verifyUrl} size={72} label="Verify" />
          </div>
        </header>

        {/* MSME strip */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-blue-50/60 border border-blue-100 px-4 py-2">
          <p className="text-[9px] text-blue-700 font-medium">
            Professional IT Training & Internship Programs · {COMPANY.address}
          </p>
          <img
            src={assetUrl(COMPANY.assets.msmeLogo)}
            alt="MSME Registered"
            className="h-10 w-auto object-contain opacity-90"
          />
        </div>

        {/* Recipient */}
        <div className="mt-6">
          <p className="text-gray-400 uppercase tracking-widest text-[9px] font-semibold">To,</p>
          <p className="mt-1 text-[20px] font-bold text-gray-900 font-serif leading-tight">{studentName}</p>
        </div>

        {/* Subject */}
        <div className="mt-5 rounded-lg overflow-hidden border border-blue-200 shadow-sm">
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-5 py-3">
            <p className="text-[9px] text-blue-200 uppercase tracking-widest font-semibold">Subject</p>
            <h2 className="text-[14px] font-bold text-white mt-0.5">
              Offer Letter — {subjectTitle}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="mt-5 space-y-3 text-gray-600">
          <p>Dear <strong className="text-gray-900">{studentName}</strong>,</p>
          <p>
            We are pleased to offer you a place in the <strong className="text-blue-800">{subjectTitle}</strong> program
            at <strong className="text-blue-800">{COMPANY.name}</strong>. After reviewing your application, we believe
            you will benefit from our structured training and internship pathway.
          </p>

          <div className="my-4 rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-blue-800 px-4 py-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-100">Program Details</p>
            </div>
            <table className="w-full text-[10.5px]">
              <tbody>
                {details.map(([label, value], idx) => (
                  <tr key={label} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"}>
                    <th scope="row" className="w-[36%] px-4 py-2.5 text-left font-semibold text-gray-500 border-r border-blue-50">{label}</th>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            You will complete mentor-reviewed tasks in <strong>{roleLabel}</strong>, submit work through our platform,
            and receive a verifiable completion certificate upon successful completion.
          </p>

          {/* Terms */}
          <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Terms & Conditions</p>
            </div>
            <ol className="px-4 py-3 space-y-1.5 list-decimal list-inside text-[10px] text-gray-600">
              {TERMS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Signature */}
        <div className="mt-6 flex flex-row items-end justify-between gap-4 border-t-2 border-blue-100 pt-5">
          <div className="flex-1">
            <img src={assetUrl(COMPANY.assets.founderSignature)} alt="" className="h-[56px] w-auto max-w-[200px] object-contain object-left" />
            <div className="mt-1 border-t border-gray-200 pt-1.5 max-w-[220px]">
              <p className="font-bold text-blue-900 text-[12px]">{COMPANY.founderName}</p>
              <p className="text-[10px] text-gray-500">{COMPANY.founderTitle}, {COMPANY.name}</p>
              <p className="text-[9px] text-gray-400">Authorized Signatory</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <img src={assetUrl(COMPANY.assets.seal)} alt="" className="h-[100px] w-[100px] object-contain" />
            <p className="text-[8px] text-gray-400 uppercase tracking-wider">Official Seal</p>
          </div>
          <VerifyQRCode value={verifyUrl} size={80} label="Scan to verify" className="hidden sm:flex" />
        </div>

        <footer className="mt-5 pt-4 border-t border-gray-200 text-[9px] text-gray-400 leading-relaxed">
          <p>Electronically generated document. No physical signature required. Verify at {COMPANY.websiteDisplay}/verify</p>
          <p className="mt-1 font-mono text-gray-500">Ref: {offerLetterId} · Intern: {internId}</p>
        </footer>
      </div>
    </article>
  );
}
