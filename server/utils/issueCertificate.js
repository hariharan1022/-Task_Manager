import crypto from "crypto";
import path from "path";
import { env } from "../config/env.js";
import { Certificate } from "../models/Certificate.js";
import { Application } from "../models/Application.js";
import { TaskSubmission } from "../models/TaskSubmission.js";
import { buildCertificatePayload } from "./buildCertificatePayload.js";
import { writeCertificatePDF } from "./generateCertificatePDF.js";

function gradeForScore(totalScore) {
  if (totalScore >= 90) return "Excellent";
  if (totalScore >= 75) return "Good";
  return "Satisfactory";
}

function newCertificateId() {
  return `SKY-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

const COMPANY = {
  name: env.company.name || "SKYROVIX",
  subtitle: "Internships & Verifiable Credentials",
  website: env.company.website || "",
  websiteDisplay: (env.company.website || "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
  email: env.company.email || "skyrovix@gmail.com",
  phone: env.company.phone || "+91 9940773204",
  address: env.company.address || "Pudukkottai, Tamil Nadu, India",
  founderName: "Hariharan S",
  founderTitle: "Founder & CEO",
  coFounderName: "Maheshwaran S",
  coFounderTitle: "Co-Founder",
  community: {
    linkedin: env.company.linkedin || "https://www.linkedin.com/in/hariharan-s-92b566381",
    instagram: env.company.instagram || "https://www.instagram.com/skyrovix_web",
    telegram: env.company.telegram || "9940773204",
    whatsapp: env.company.whatsapp || "9940773204",
  },
};

async function renderCertificatePDF(cert, student, app, internship) {
  const payload = buildCertificatePayload(cert, student, app, internship);
  const outDir = path.resolve(process.cwd(), env.uploadsDir, "certificates");
  const { fileName } = await writeCertificatePDF({ ...payload, company: COMPANY }, outDir);
  return {
    pdfURL: `/uploads/certificates/${fileName}`,
    pdfPath: path.join(outDir, fileName),
  };
}

export async function recalculateTotalScore(applicationId) {
  const subs = await TaskSubmission.find({ application: applicationId, status: "approved" });
  return subs.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
}

export async function ensureCertificateForApplication(applicationId) {
  const app = await Application.findById(applicationId);
  if (!app) return null;

  const internship = app.internship
    ? { title: "", domain: "", duration: "", ...(typeof app.internship === "object" ? app.internship : {}) }
    : { title: "", domain: "", duration: "" };

  // Need to populate student and internship data manually via find
  let studentData = null;
  let internshipData = null;
  if (app.student) {
    const { User } = await import("../models/User.js");
    studentData = await User.findById(typeof app.student === "object" ? app.student._id || app.student.id : app.student);
  }
  if (app.internship) {
    const { InternshipProgram } = await import("../models/Internship.js");
    internshipData = await InternshipProgram.findById(typeof app.internship === "object" ? app.internship._id || app.internship.id : app.internship);
  }

  const fromTasks = await recalculateTotalScore(applicationId);
  let totalScore = Math.max(Number(app.totalScore) || 0, fromTasks);

  const shouldIssue = app.status === "completed" || totalScore >= 100;

  if (!shouldIssue) {
    if (fromTasks !== app.totalScore) {
      await Application.findByIdAndUpdate(applicationId, { totalScore: fromTasks });
    }
    return app;
  }

  if (app.status === "completed" && totalScore === 0 && fromTasks === 0) {
    totalScore = 100;
  }

  await Application.findByIdAndUpdate(applicationId, { totalScore });

  let cert = await Certificate.findOne({ application: applicationId });
  const grade = gradeForScore(totalScore);

  if (!cert) {
    cert = await Certificate.create({
      student: app.student,
      application: applicationId,
      certificateId: newCertificateId(),
      score: totalScore,
      grade,
      issuedAt: new Date(),
    });
  } else {
    const updateData = { score: totalScore, grade };
    if (!cert.issuedAt) updateData.issuedAt = new Date();
    await Certificate.findByIdAndUpdate(cert._id || cert.id, updateData);
    cert = { ...cert, ...updateData };
  }

  try {
    const { pdfURL, pdfPath } = await renderCertificatePDF(
      cert,
      studentData || app.student,
      app,
      internshipData || app.internship
    );
    if (cert.pdfURL !== pdfURL || cert.pdfPath !== pdfPath) {
      await Certificate.findByIdAndUpdate(cert._id || cert.id, { pdfURL, pdfPath });
      cert.pdfURL = pdfURL;
      cert.pdfPath = pdfPath;
    }
  } catch (err) {
    console.error("[certificate] PDF generation failed:", err.message);
  }

  await Application.findByIdAndUpdate(applicationId, {
    status: "completed",
    completedAt: new Date(),
    certificateURL: `/verify-certificate/${cert.certificateId}`,
  });

  return app;
}

export async function issueCertificateIfEligible(applicationId) {
  return ensureCertificateForApplication(applicationId);
}
