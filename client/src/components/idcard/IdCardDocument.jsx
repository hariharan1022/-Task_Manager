import { assetUrl, verifyPageUrl } from "../../utils/paths.js";
import { COMPANY } from "../../constants/company.js";
import VerifyQRCode from "../common/VerifyQRCode.jsx";
import { buildInternId, formatIdValidUntil, resolvePhotoUrl } from "./idCardUtils.js";

function PhotoBlock({ photo, name }) {
  const initials = (name || "IN").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <div className="relative z-[1] mx-auto h-[92px] w-[92px] rounded-full border-[3px] border-white/80 bg-white/20 p-0.5 shadow-lg backdrop-blur-sm">
      <div className="h-full w-full overflow-hidden rounded-full bg-white/90">
        {photo ? (
          <img src={photo} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 text-xl font-bold text-blue-800">{initials}</div>
        )}
      </div>
    </div>
  );
}

function IdCardFront({ user, internship, photo, internId, validUntil, verifyUrl }) {
  const displayName = (user?.fullName || "TRAINEE").toUpperCase();
  const role = internship?.domain || internship?.title || "Intern";

  return (
    <div className="id-card-face relative flex h-[340px] w-[214px] flex-col overflow-hidden rounded-2xl border border-white/30 shadow-2xl">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800" />
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-blue-400/20 blur-xl" />

      <div className="relative z-[1] flex flex-1 flex-col px-4 pt-5 pb-4 text-center text-white">
        <div className="flex items-center justify-between mb-2">
          <img src={assetUrl("/skyrovix-logo.png")} alt={COMPANY.name} className="h-7 w-auto object-contain brightness-0 invert" />
          <img src={assetUrl(COMPANY.assets.msmeLogo)} alt="MSME" className="h-6 w-auto object-contain brightness-0 invert opacity-80" />
        </div>

        <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-blue-200">{COMPANY.name}</p>
        <p className="text-[7px] text-blue-200/80 mb-3">Trainee / Intern Identity Card</p>

        <PhotoBlock photo={photo} name={user?.fullName} />

        <h2 className="mt-3 font-display text-[14px] font-extrabold leading-tight tracking-wide">{displayName}</h2>
        <p className="mt-0.5 text-[10px] font-medium text-blue-100">{role}</p>
        <p className="mt-1 font-mono text-[8px] text-blue-200">{internId}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="text-left text-[7px] text-blue-200 leading-snug">
            <p className="font-semibold text-white/90">Valid until</p>
            <p>{validUntil}</p>
          </div>
          <VerifyQRCode value={verifyUrl} size={52} label="" className="[&_img]:rounded [&_div]:border-white/40 [&_div]:bg-white/90" />
        </div>
      </div>
    </div>
  );
}

function IdCardBack({ user, internship, internId, validUntil, verifyUrl }) {
  return (
    <div className="id-card-face relative flex h-[340px] w-[214px] flex-col overflow-hidden rounded-2xl border border-white/30 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900" />
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

      <div className="relative z-[1] flex flex-1 flex-col px-4 pt-5 pb-4 text-white">
        <div className="text-center mb-3">
          <img src={assetUrl("/skyrovix-logo.png")} alt={COMPANY.name} className="mx-auto h-8 w-auto object-contain brightness-0 invert" />
          <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-blue-200">{COMPANY.name}</p>
        </div>

        <dl className="space-y-1.5 text-[8px] text-blue-100 flex-1 leading-snug">
          {[
            ["Intern ID", internId],
            ["Email", user?.email || "—"],
            ["Phone", user?.phone || "—"],
            ["College", user?.college || "—"],
            ["Program", internship?.title || "—"],
            ["Domain", internship?.domain || "—"],
            ["Valid", validUntil],
            ["Website", COMPANY.websiteDisplay],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-[46px] shrink-0 font-semibold text-blue-300">{label}</dt>
              <dd className="break-all font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-2 rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-[6.5px] text-blue-200 leading-relaxed">
          <strong className="text-white/90">Terms:</strong> This card is property of {COMPANY.name}. Misuse is prohibited.
          For verification, scan the QR code or visit {COMPANY.websiteDisplay}/verify
        </div>

        <div className="mt-2 flex justify-center">
          <VerifyQRCode value={verifyUrl} size={56} label="Verify ID" className="[&_div]:border-white/40 [&_div]:bg-white" />
        </div>
      </div>
    </div>
  );
}

export default function IdCardDocument({ user, application, internship }) {
  const internId = buildInternId(application || {}, user);
  const photo = resolvePhotoUrl(user?.profilePhoto);
  const validUntil = formatIdValidUntil(application, internship);
  const verifyUrl = verifyPageUrl("intern", internId);

  return (
    <div className="id-card-set flex flex-wrap items-start justify-center gap-6 sm:gap-8" aria-label="Intern ID card front and back">
      <div className="text-center">
        <p className="print:hidden mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-600">Front</p>
        <IdCardFront user={user} internship={internship} photo={photo} internId={internId} validUntil={validUntil} verifyUrl={verifyUrl} />
      </div>
      <div className="text-center">
        <p className="print:hidden mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-600">Back</p>
        <IdCardBack user={user} internship={internship} internId={internId} validUntil={validUntil} verifyUrl={verifyUrl} />
      </div>
    </div>
  );
}
