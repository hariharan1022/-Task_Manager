import { Certificate } from "../models/Certificate.js";
import { Application } from "../models/Application.js";
import { buildCertificatePayload } from "../utils/buildCertificatePayload.js";
import { detectDocumentType } from "../utils/documentIds.js";

async function verifyCertificateById(certId, res) {
  const cert = await Certificate.findOne({ certificateId: certId })
    .populate("student", "full_name college department graduation_year profile_photo email phone")
    .populate({
      path: "application",
      populate: { path: "internship", select: "title domain duration" },
    });
  if (!cert) {
    return res.status(404).json({ valid: false, type: "certificate", message: "Certificate not found" });
  }
  const certificate = buildCertificatePayload(
    cert,
    cert.student,
    cert.application,
    cert.application?.internship
  );
  certificate.pdfURL = cert.pdfURL || "";
  return res.json({
    valid: true,
    type: "certificate",
    certificate,
    candidate: {
      name: cert.student?.fullName,
      college: cert.student?.college,
      program: cert.application?.internship?.title,
      domain: cert.application?.internship?.domain,
    },
  });
}

async function verifyOfferById(offerId, res) {
  const app = await Application.findOne({ offerLetterId: offerId })
    .populate("student", "full_name email college department graduation_year phone")
    .populate("internship", "title domain duration");
  if (!app || !["accepted", "completed"].includes(app.status)) {
    return res.status(404).json({ valid: false, type: "offer", message: "Offer letter not found" });
  }
  return res.json({
    valid: true,
    type: "offer",
    offer: {
      offerLetterId: app.offerLetterId,
      internId: app.internId,
      candidateName: app.student?.fullName,
      email: app.student?.email,
      college: app.student?.college,
      program: app.internship?.title,
      domain: app.internship?.domain,
      duration: app.internship?.duration,
      mode: app.internshipMode || "Online",
      status: app.status,
      issuedAt: app.appliedAt || app.createdAt,
    },
  });
}

async function verifyInternById(internId, res) {
  const app = await Application.findOne({ internId })
    .populate("student", "full_name email college department graduation_year phone profile_photo")
    .populate("internship", "title domain duration");
  if (!app || !["accepted", "completed"].includes(app.status)) {
    return res.status(404).json({ valid: false, type: "intern", message: "Intern ID not found" });
  }
  return res.json({
    valid: true,
    type: "intern",
    intern: {
      internId: app.internId,
      offerLetterId: app.offerLetterId,
      candidateName: app.student?.fullName,
      email: app.student?.email,
      phone: app.student?.phone,
      college: app.student?.college,
      department: app.student?.department,
      program: app.internship?.title,
      domain: app.internship?.domain,
      duration: app.internship?.duration,
      mode: app.internshipMode || "Online",
      status: app.status,
      profilePhoto: app.student?.profilePhoto || "",
      validFrom: app.appliedAt || app.createdAt,
    },
  });
}

export async function verifyDocument(req, res, next) {
  try {
    const { type, id } = req.params;
    const docId = decodeURIComponent(id || "").trim();
    if (!docId) {
      return res.status(400).json({ valid: false, message: "Document ID is required" });
    }
    if (type === "certificate") return verifyCertificateById(docId, res);
    if (type === "offer") return verifyOfferById(docId, res);
    if (type === "intern") return verifyInternById(docId, res);
    return res.status(400).json({ valid: false, message: "Invalid verification type" });
  } catch (err) {
    next(err);
  }
}

export async function verifySearch(req, res, next) {
  try {
    const q = String(req.query.q || req.query.id || "").trim();
    if (!q) {
      return res.status(400).json({ valid: false, message: "Enter a Certificate, Offer Letter, or Intern ID" });
    }
    const type = detectDocumentType(q);
    if (type === "certificate") return verifyCertificateById(q, res);
    if (type === "offer") return verifyOfferById(q, res);
    if (type === "intern") return verifyInternById(q, res);
    return res.status(404).json({
      valid: false,
      message: "Unrecognized ID format. Use CERT-*, OFFER-*, or SKX-* IDs.",
    });
  } catch (err) {
    next(err);
  }
}
