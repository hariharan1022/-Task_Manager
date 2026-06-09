export function buildInternId(application) {
  const base = new Date(application?.appliedAt || application?.createdAt || Date.now());
  const mon = base.toLocaleString("en", { month: "short" }).toUpperCase();
  const yr = String(base.getFullYear()).slice(-2);
  const suffix = String(application?._id || application?.id || "000000")
    .replace(/[^a-f0-9]/gi, "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0");
  return `SKX-${mon}${yr}-${suffix}`;
}

export function buildCertificatePayload(cert, student, application, internship) {
  const score = cert?.score ?? application?.totalScore ?? 0;
  return {
    id: cert?.certificateId || "",
    certificateId: cert?.certificateId || "",
    studentName: student?.fullName || "Intern",
    college: student?.college || "",
    degree: student?.department || "",
    year: student?.graduationYear ?? null,
    profilePhoto: student?.profilePhoto || "",
    program: internship?.title || "",
    title: internship?.title || "",
    domain: internship?.domain || "",
    duration: internship?.duration || "",
    score,
    percentage: score,
    grade: cert?.grade || "Good",
    issuedAt: cert?.issuedAt,
    completedAt: application?.completedAt || cert?.issuedAt,
    internId: application?.internId || buildInternId(application),
    projectName: application?.projectsHighlight || "",
  };
}
