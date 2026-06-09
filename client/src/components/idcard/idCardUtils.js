import { buildInternId } from "../offer/offerLetterUtils.js";

export { buildInternId };

export function resolvePhotoUrl(profilePhoto) {
  if (!profilePhoto) return "";
  if (/^https?:\/\//i.test(profilePhoto) || profilePhoto.startsWith("data:")) {
    return profilePhoto;
  }
  return profilePhoto;
}

export function formatIdValidUntil(application, internship) {
  const start = new Date(application?.appliedAt || application?.createdAt || Date.now());
  const match = String(internship?.duration || "").match(/(\d+)\s*month/i);
  const months = match ? Number.parseInt(match[1], 10) : 6;
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}
