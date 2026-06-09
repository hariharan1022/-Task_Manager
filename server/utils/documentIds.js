import crypto from "crypto";

export function generateOfferLetterId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `OFFER-${stamp}-${rand}`;
}

export function buildInternIdFromApplication(application) {
  const base = new Date(application.appliedAt || application.createdAt || Date.now());
  const mon = base.toLocaleString("en", { month: "short" }).toUpperCase();
  const yr = String(base.getFullYear()).slice(-2);
  const suffix = String(application._id || application.id || "000000")
    .replace(/[^a-f0-9]/gi, "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0");
  return `SKX-${mon}${yr}-${suffix}`;
}

export async function ensureApplicationDocumentIds(application) {
  let changed = false;
  if (!application.internId) {
    application.internId = buildInternIdFromApplication(application);
    changed = true;
  }
  if (!application.offerLetterId) {
    application.offerLetterId = generateOfferLetterId();
    changed = true;
  }
  if (changed) await Application.findByIdAndUpdate(application._id || application.id, {
    internId: application.internId,
    offerLetterId: application.offerLetterId,
  });
  return application;
}

export function detectDocumentType(id) {
  const value = String(id || "").trim().toUpperCase();
  if (!value) return null;
  if (/^(CERT|SKY)-/.test(value)) return "certificate";
  if (/^OFFER-/.test(value)) return "offer";
  if (/^SKX-/.test(value)) return "intern";
  return null;
}
