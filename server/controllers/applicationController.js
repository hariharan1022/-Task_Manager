import { Application } from "../models/Application.js";
import { InternshipProgram } from "../models/Internship.js";
import { sendEmail } from "../utils/sendEmail.js";
import { env } from "../config/env.js";
import { createNotification } from "../utils/createNotification.js";
import { ensureCertificateForApplication } from "../utils/issueCertificate.js";
import { buildCertificatePayload } from "../utils/buildCertificatePayload.js";
import { Certificate } from "../models/Certificate.js";
import { ensureApplicationDocumentIds } from "../utils/documentIds.js";

function isLinkedInUrl(url) {
  try {
    const u = new URL(url);
    return /linkedin\.com/i.test(u.hostname);
  } catch {
    return false;
  }
}

export async function applyForInternship(req, res, next) {
  try {
    const {
      internshipId,
      motivation,
      skills,
      availability,
      relevantExperience,
      projectsHighlight,
      linkedInUrl,
      githubUrl,
      hoursPerWeek,
      expectedStart,
    } = req.body;
    if (!internshipId) {
      return res.status(400).json({ message: "internshipId is required" });
    }
    const internship = await InternshipProgram.findOne({
      _id: internshipId,
      isActive: true,
    });
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }
    const exists = await Application.findOne({
      student: req.user._id,
      internship: internship._id,
    });
    if (exists) {
      return res.status(409).json({ message: "You have already applied to this internship" });
    }
    const appData = {
      student: req.user._id,
      internship: internship._id,
      motivation: motivation?.trim() || "",
      skills: Array.isArray(skills) ? skills : typeof skills === "string" ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      availability: availability?.trim() || "",
      relevantExperience: relevantExperience?.trim() || "",
      projectsHighlight: projectsHighlight?.trim() || "",
      linkedInUrl: linkedInUrl?.trim() || "",
      githubUrl: githubUrl?.trim() || "",
      hoursPerWeek: hoursPerWeek?.trim() || "",
      expectedStart: expectedStart?.trim() || "",
      internshipMode: "Online",
    };
    if (env.autoAcceptApplications) {
      appData.status = "accepted";
      appData.offerLetterURL = "/dashboard/offer-letter";
    }
    const application = await Application.create(appData);
    if (env.autoAcceptApplications) {
      await ensureApplicationDocumentIds(application);
    }
    if (env.autoAcceptApplications && req.user?.email) {
      await sendEmail({
        to: req.user.email,
        subject: `Accepted — ${internship.title}`,
        text: `Hi! Your application for ${internship.title} has been accepted. Open your dashboard to start the 5 tasks.`,
      }).catch(() => {});
      await createNotification(req.user._id, {
        type: "application",
        title: "Application accepted",
        body: `You're in! Start your 5 tasks for ${internship.title}.`,
        link: "/dashboard/tasks",
        meta: { applicationId: application._id || application.id, status: "accepted" },
      });
    } else {
      await createNotification(req.user._id, {
        type: "application",
        title: "Application submitted",
        body: `We received your application for ${internship.title}. You'll be notified when it's reviewed.`,
        link: "/dashboard/my-internships",
        meta: { applicationId: application._id || application.id, status: "pending" },
      });
    }
    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
}

export async function myApplications(req, res, next) {
  try {
    if (env.autoAcceptApplications) {
      const pending = await Application.find({
        student: req.user._id,
        status: "pending",
      });
      for (const app of pending) {
        await Application.findByIdAndUpdate(app._id, { status: "accepted", offerLetterURL: "/dashboard/offer-letter" });
        await ensureApplicationDocumentIds(app);
      }
    }
    const items = await Application.find({ student: req.user._id })
      .populate("internship", "title domain duration stipend coverImage")
      .sort({ createdAt: -1 });

    await Promise.all(
      items.filter((a) => a.status === "completed" || (a.totalScore || 0) >= 100)
        .map((a) => ensureCertificateForApplication(a._id).catch(() => null))
    );

    const refreshed = await Application.find({ student: req.user._id })
      .populate("internship", "title domain duration stipend coverImage")
      .sort({ createdAt: -1 });

    res.json({ items: refreshed });
  } catch (err) {
    next(err);
  }
}

export async function listAllApplications(req, res, next) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const items = await Application.find(filter)
      .populate("student", "fullName email college")
      .populate("internship", "title domain duration")
      .sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function leaderboard(req, res, next) {
  try {
    const items = await Application.find({ status: { $in: ["accepted", "completed"] } })
      .populate("student", "fullName college")
      .populate("internship", "title domain")
      .sort({ totalScore: -1, updatedAt: -1 })
      .limit(50);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function submitOfferLinkedInPost(req, res, next) {
  try {
    const { postUrl } = req.body;
    if (!postUrl || !isLinkedInUrl(postUrl)) {
      return res.status(400).json({ message: "A valid LinkedIn post URL is required (linkedin.com)" });
    }
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (!["accepted", "completed"].includes(app.status)) {
      return res.status(400).json({ message: "Your application must be accepted before sharing your offer letter" });
    }
    const update = {
      offerLetterLinkedInPost: postUrl.trim(),
      offerLetterPostedAt: new Date(),
    };
    if (!app.offerLetterURL) update.offerLetterURL = "/dashboard/offer-letter";
    await Application.findByIdAndUpdate(app._id, update);
    const updated = await Application.findById(app._id);
    res.json({ application: updated, message: "LinkedIn post saved. Your 5 tasks are now unlocked." });
  } catch (err) {
    next(err);
  }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    const { status, feedback } = req.body;
    if (!["pending", "accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found" });
    const prevStatus = app.status;

    const updateFields = { status };
    if (feedback) updateFields.adminFeedback = feedback.trim();
    if (status === "accepted" && !app.offerLetterURL) {
      updateFields.offerLetterURL = "/dashboard/offer-letter";
    }
    if (status === "completed") updateFields.completedAt = new Date();

    await Application.findByIdAndUpdate(app._id, updateFields);

    if (status === "completed") {
      await ensureCertificateForApplication(app._id);
    }

    // Get program title for notification
    let programTitle = "Internship";
    if (app.internship) {
      const prog = await InternshipProgram.findById(typeof app.internship === "object" ? app.internship._id || app.internship.id : app.internship);
      if (prog) programTitle = prog.title;
    }

    if (prevStatus !== status && app.student) {
      const studentId = typeof app.student === "object" ? app.student._id || app.student.id : app.student;
      const studentEmail = app.student?.email;

      const statusMessages = {
        accepted: {
          title: "Application accepted",
          body: `Congratulations! You've been accepted to ${programTitle}. View your offer letter and unlock tasks.`,
          link: "/dashboard/offer-letter",
        },
        rejected: {
          title: "Application update",
          body: `Your application for ${programTitle} was not accepted this round.${feedback ? ` Feedback: ${feedback}` : ""}`,
          link: "/dashboard/my-internships",
        },
        completed: {
          title: "Program completed",
          body: `You've completed ${programTitle}. View your certificate in the dashboard.`,
          link: "/dashboard/certificate",
        },
        pending: {
          title: "Application status updated",
          body: `Your application for ${programTitle} is now pending review.`,
          link: "/dashboard/my-internships",
        },
      };
      const msg = statusMessages[status];
      if (msg && studentId) {
        await createNotification(studentId, {
          type: "application",
          title: msg.title,
          body: msg.body,
          link: msg.link,
          meta: { applicationId: app._id, status, feedback: feedback || "" },
        });
      }

      if (studentEmail) {
        await sendEmail({
          to: studentEmail,
          subject: `Application ${status} - ${programTitle}`,
          text: `Hi ${app.student?.fullName || "Intern"}, your application status is now: ${status}.${feedback ? `\n\nFeedback: ${feedback}` : ""}`,
        }).catch(() => {});
      }
    }

    const updated = await Application.findById(app._id)
      .populate("student", "fullName email")
      .populate("internship", "title");
    res.json({ application: updated || app });
  } catch (err) {
    next(err);
  }
}

export async function getApplicationCertificate(req, res, next) {
  try {
    const app = await Application.findOne({ _id: req.params.id, student: req.user._id });
    if (!app) return res.status(404).json({ message: "Application not found" });

    await ensureCertificateForApplication(app._id);

    const refreshed = await Application.findById(app._id)
      .populate("internship", "title domain duration");
    const cert = await Certificate.findOne({ application: app._id });
    if (!cert) return res.status(404).json({ message: "Certificate not available yet" });

    // Get student data
    const { User } = await import("../models/User.js");
    const student = await User.findById(cert.student);

    // Get internship from refreshed app
    const certApp = await Application.findById(app._id)
      .populate("internship", "title domain duration");
    const internship = certApp?.internship || {};

    res.json({
      application: refreshed,
      certificate: {
        ...buildCertificatePayload(cert, student, certApp, internship),
        pdfURL: cert.pdfURL || "",
      },
    });
  } catch (err) {
    next(err);
  }
}
