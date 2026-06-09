import { Download } from "lucide-react";
import { assetUrl, verifyPageUrl } from "../../utils/paths.js";
import { COMPANY } from "../../constants/company.js";
import VerifyQRCode from "../common/VerifyQRCode.jsx";
import { formatCertificateDate, resolvePhotoUrl } from "./certificateUtils.js";

function StudentPhoto({ photo, name }) {
  const initials = (name || "ST").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-[90px] h-[108px] rounded border-[3px] border-amber-400 bg-white overflow-hidden shadow-md ring-2 ring-amber-100">
      {photo ? (
        <img src={photo} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-amber-50 text-2xl font-bold text-blue-800">{initials}</div>
      )}
    </div>
  );
}

export default function CertificateDocument({ data }) {
  const {
    studentName, college, degree, year, profilePhoto, program, domain, duration,
    percentage = 0, grade, issuedAt, internId, id: certificateId, pdfURL = "",
    projectName = "",
  } = data;

  const photoSrc = resolvePhotoUrl(profilePhoto);
  const issuedLabel = formatCertificateDate(issuedAt);
  const displayName = (studentName || "TRAINEE").toUpperCase();
  const verifyUrl = verifyPageUrl("certificate", certificateId);
  const periodLabel = duration || "Training & Internship Program";
  const isElite = percentage >= 90;
  const isMerit = percentage >= 75 && percentage < 90;
  const badgeLabel = isElite ? "Elite Performer" : isMerit ? "Merit Award" : grade || "Certified";

  return (
    <div className="space-y-3">
      {pdfURL && (
        <div className="print:hidden flex justify-center">
          <a href={pdfURL} target="_blank" rel="noreferrer" className="btn-primary text-sm">
            <Download size={16} /> Download certificate PDF
          </a>
        </div>
      )}

      {/* Landscape certificate */}
      <article
        className="relative mx-auto w-full max-w-[297mm] aspect-[297/210] overflow-hidden bg-white shadow-2xl print:shadow-none print:aspect-auto"
        aria-label="Internship completion certificate"
      >
        <div className="absolute inset-0 p-2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
          <div className="absolute inset-2 p-[3px] bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 rounded-sm">
            <div className="relative h-full w-full bg-gradient-to-br from-blue-50/30 via-white to-amber-50/20 overflow-hidden rounded-sm px-8 py-6 sm:px-12 sm:py-8 print:px-10 print:py-6">

              {/* Corner ornaments */}
              <div className="absolute inset-4 pointer-events-none" aria-hidden>
                {["tl","tr","bl","br"].map((c) => (
                  <div key={c} className={`absolute w-16 h-16 border-amber-400/70 ${
                    c === "tl" ? "top-0 left-0 border-t-2 border-l-2" :
                    c === "tr" ? "top-0 right-0 border-t-2 border-r-2" :
                    c === "bl" ? "bottom-0 left-0 border-b-2 border-l-2" :
                    "bottom-0 right-0 border-b-2 border-r-2"
                  }`} />
                ))}
              </div>

              <div className="relative flex h-full flex-col">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={assetUrl("/skyrovix-logo.png")} alt={COMPANY.name} className="h-12 w-auto object-contain" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">{COMPANY.name}</p>
                      <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider">{COMPANY.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StudentPhoto photo={photoSrc} name={studentName} />
                    <VerifyQRCode value={verifyUrl} size={72} label="Verify" />
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mt-3 flex-1 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-3 mx-auto mb-2">
                    <div className="h-px w-14 bg-gradient-to-r from-transparent to-amber-400" />
                    <span className={`px-4 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white rounded-sm shadow ${
                      isElite ? "bg-gradient-to-r from-amber-600 to-yellow-500" :
                      isMerit ? "bg-gradient-to-r from-blue-700 to-blue-600" :
                      "bg-gradient-to-r from-blue-800 to-blue-700"
                    }`}>{badgeLabel}</span>
                    <div className="h-px w-14 bg-gradient-to-r from-amber-400 to-transparent" />
                  </div>

                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-blue-950 tracking-tight uppercase">
                    Certificate of Completion
                  </h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">
                    Professional IT Training & Internship · {COMPANY.name}
                  </p>
                  <div className="mx-auto mt-2 w-40 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                  <p className="mt-4 text-xs text-gray-500 italic">This is to certify that</p>
                  <p className="font-serif text-3xl sm:text-4xl font-bold text-blue-950 tracking-wide mt-1">{displayName}</p>
                  <div className="mx-auto mt-2 w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" />

                  <p className="mt-3 text-xs text-gray-500">has successfully completed</p>
                  <p className="font-serif text-lg sm:text-xl font-bold text-blue-900 mt-1">{program}</p>
                  {domain && <p className="text-sm font-semibold text-blue-600">{domain}</p>}
                  {projectName && (
                    <p className="mt-1 text-xs text-gray-500">Project: <strong className="text-gray-700">{projectName}</strong></p>
                  )}

                  {percentage > 0 && (
                    <div className="mt-3 inline-flex items-center gap-5 bg-white border-2 border-amber-200 rounded-lg px-5 py-2 shadow-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-800">{percentage}%</p>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">Score</p>
                      </div>
                      {grade && (
                        <>
                          <div className="w-px h-8 bg-amber-200" />
                          <div className="text-center">
                            <p className="text-2xl font-bold text-amber-600">{grade}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider">Grade</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <p className="mt-2 text-[10px] text-gray-400">
                    {college ? `${college}${degree ? ` · ${degree}` : ""}${year ? ` · ${year}` : ""}` : "Verified completion"}
                    {" · "}{periodLabel}
                  </p>
                </div>

                {/* Bottom row */}
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t-2 border-amber-200/60 pt-4">
                  <div className="text-center min-w-[130px]">
                    <img src={assetUrl(COMPANY.assets.founderSignature)} alt="" className="mx-auto h-10 w-auto max-w-[140px] object-contain" />
                    <div className="mt-1 border-t border-blue-100 pt-1 max-w-[150px] mx-auto">
                      <p className="text-[10px] font-bold text-blue-900">{COMPANY.founderName}</p>
                      <p className="text-[8px] text-gray-500">{COMPANY.founderTitle}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <img src={assetUrl(COMPANY.assets.seal)} alt="" className="mx-auto h-14 w-14 object-contain" />
                    <p className="text-[10px] font-bold text-blue-800 mt-1">{issuedLabel}</p>
                    <p className="text-[8px] font-mono text-gray-400">ID: {internId}</p>
                  </div>

                  <div className="text-center min-w-[100px]">
                    <img src={assetUrl(COMPANY.assets.msmeLogo)} alt="MSME" className="mx-auto h-10 w-auto object-contain" />
                    <p className="text-[8px] text-gray-400 mt-0.5">MSME Registered</p>
                  </div>

                  <VerifyQRCode value={verifyUrl} size={64} label="Scan to verify" />
                </div>

                <footer className="mt-3 flex items-center justify-between gap-2 bg-gradient-to-r from-blue-950 to-blue-900 -mx-8 sm:-mx-12 px-8 sm:px-12 py-2 text-[8px] text-white/70 print:-mx-10">
                  <span className="font-mono">Certificate ID: {certificateId}</span>
                  <span className="text-right truncate max-w-[50%]">{verifyUrl.replace(/^https?:\/\//, "")}</span>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
