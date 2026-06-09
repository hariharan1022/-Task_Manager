export function formatLetterDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function buildInternId(application, user) {
  if (application?.internId) return application.internId;
  const base = new Date(application.appliedAt || application.createdAt || Date.now());
  const mon = base.toLocaleString("en", { month: "short" }).toUpperCase();
  const yr = String(base.getFullYear()).slice(-2);
  const suffix = String(application._id || user?._id || "000000")
    .replace(/[^a-f0-9]/gi, "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0");
  return `SKX-${mon}${yr}-${suffix}`;
}

export function resolveOfferLetterId(application) {
  return application?.offerLetterId || `OFFER-PENDING-${String(application?._id || "").slice(-6).toUpperCase()}`;
}

function parseDurationMonths(duration) {
  const match = String(duration || "").match(/(\d+)\s*month/i);
  return match ? Number.parseInt(match[1], 10) : 2;
}

export function internshipDates(application, internship) {
  const start = new Date(application.appliedAt || application.createdAt || Date.now());
  const end = new Date(start);
  end.setMonth(end.getMonth() + parseDurationMonths(internship?.duration));
  return { start, end };
}
