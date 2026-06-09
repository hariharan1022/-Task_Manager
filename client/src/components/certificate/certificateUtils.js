import { buildInternId } from "../offer/offerLetterUtils.js";

export { buildInternId };

export function formatCertificateDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function extractCertificateId(certificateURL) {
  if (!certificateURL) return null;
  const match = String(certificateURL).match(/verify-certificate\/([^/?#]+)/i);
  return match ? match[1] : null;
}

export function resolvePhotoUrl(profilePhoto) {
  if (!profilePhoto) return "";
  if (/^https?:\/\//i.test(profilePhoto) || profilePhoto.startsWith("data:")) {
    return profilePhoto;
  }
  return profilePhoto;
}
