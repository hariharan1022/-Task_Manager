import { CertificatePayment } from "../models/CertificatePayment.js";
import { VerificationLog } from "../models/VerificationLog.js";
import { Application } from "../models/Application.js";
import { createNotification } from "../utils/createNotification.js";
import { ensureCertificateForApplication } from "../utils/issueCertificate.js";
import { emitEvent } from "../config/socket.js";

export async function submitPayment(req, res, next) {
  try {
    const { applicationId, certificateId, programName, transactionId, screenshotUrl } = req.body;
    if (!transactionId) {
      return res.status(400).json({ message: "UPI Transaction ID is required" });
    }
    if (!certificateId) {
      return res.status(400).json({ message: "Certificate ID is required" });
    }

    const existing = await CertificatePayment.findOne({
      student: req.user._id,
      application: applicationId || undefined,
      certificateId,
    });
    if (existing && existing.status === "pending") {
      return res.status(409).json({ message: "Payment already submitted and pending approval" });
    }
    if (existing && existing.status === "approved") {
      return res.status(409).json({ message: "Payment already approved" });
    }

    const payment = await CertificatePayment.create({
      student: req.user._id,
      application: applicationId || null,
      certificateId,
      studentName: req.user.fullName,
      email: req.user.email,
      programName: programName || "",
      amount: 100,
      transactionId: transactionId.trim(),
      screenshotUrl: screenshotUrl || "",
      status: "pending",
      submittedAt: new Date(),
    });

    await createNotification(req.user._id, {
      type: "system",
      title: "Payment submitted",
      body: `Your ₹100 payment for ${programName || "certificate"} has been submitted. Waiting for admin approval.`,
      link: "/dashboard/certificate",
      meta: { paymentId: payment._id, status: "pending" },
    });

    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
}

export async function myPayments(req, res, next) {
  try {
    const items = await CertificatePayment.find({ student: req.user._id })
      .sort({ submittedAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function adminListPayments(req, res, next) {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
        { certificateId: { $regex: search, $options: "i" } },
      ];
    }
    const items = await CertificatePayment.find(filter)
      .sort({ submittedAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function adminPaymentStats(req, res, next) {
  try {
    const all = await CertificatePayment.find({});
    const pending = all.filter((p) => p.status === "pending").length;
    const approved = all.filter((p) => p.status === "approved").length;
    const rejected = all.filter((p) => p.status === "rejected").length;
    const totalRevenue = all
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    res.json({ pending, approved, rejected, totalRevenue });
  } catch (err) {
    next(err);
  }
}

export async function approvePayment(req, res, next) {
  try {
    console.log("[approvePayment] Starting approval for payment:", req.params.id);
    const payment = await CertificatePayment.findById(req.params.id);
    if (!payment) {
      console.log("[approvePayment] Payment not found:", req.params.id);
      return res.status(404).json({ message: "Payment not found" });
    }
    if (payment.status !== "pending") {
      console.log("[approvePayment] Payment already", payment.status, ":", req.params.id);
      return res.status(400).json({ message: `Payment already ${payment.status}` });
    }

    console.log("[approvePayment] Updating payment", req.params.id, "to approved");
    const updated = await CertificatePayment.findByIdAndUpdate(req.params.id, {
      status: "approved",
      approvedAt: new Date(),
      approvedBy: req.user._id,
    }, { new: true });
    console.log("[approvePayment] Payment updated successfully:", updated._id);

    const studentId = updated.student;
    if (studentId) {
      console.log("[approvePayment] Sending notification to student:", studentId);
      await createNotification(studentId, {
        type: "system",
        title: "Payment approved",
        body: `Your ₹100 payment for ${updated.programName || "certificate"} has been approved. You can now download your certificate.`,
        link: "/dashboard/certificate",
        meta: { paymentId: updated._id, status: "approved" },
      });
    }

    emitEvent("payment_approved", { paymentId: updated._id, studentId: updated.student });
    console.log("[approvePayment] Done");
    res.json({ payment: updated });
  } catch (err) {
    console.error("[approvePayment] Error:", err.message, err.stack);
    next(err);
  }
}

export async function rejectPayment(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const payment = await CertificatePayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status !== "pending") {
      return res.status(400).json({ message: `Payment already ${payment.status}` });
    }

    const updated = await CertificatePayment.findByIdAndUpdate(req.params.id, {
      status: "rejected",
      rejectionReason: reason.trim(),
    }, { new: true });

    const studentId = updated.student;
    if (studentId) {
      await createNotification(studentId, {
        type: "system",
        title: "Payment rejected",
        body: `Your ₹100 payment for ${updated.programName || "certificate"} was rejected. Reason: ${reason}`,
        link: "/dashboard/certificate",
        meta: { paymentId: updated._id, status: "rejected", rejectionReason: reason },
      });
    }

    res.json({ payment: updated });
  } catch (err) {
    next(err);
  }
}

export async function approvePaymentAndGenerateCertificate(req, res, next) {
  try {
    const paymentId = req.params.id;
    console.log("=".repeat(60));
    console.log("[approveAndGenerate] ===== STARTING APPROVE & GENERATE =====");
    console.log("[approveAndGenerate] Payment ID:", paymentId);
    console.log("[approveAndGenerate] Admin user:", req.user?._id, req.user?.email);

    console.log("[approveAndGenerate] Step 1: Fetching payment record...");
    const payment = await CertificatePayment.findById(paymentId);
    if (!payment) {
      console.log("[approveAndGenerate] FAILED: Payment not found:", paymentId);
      return res.status(404).json({ message: "Payment not found" });
    }
    console.log("[approveAndGenerate] Payment found:", {
      _id: payment._id,
      status: payment.status,
      student: payment.student,
      application: payment.application,
      certificateId: payment.certificateId,
      programName: payment.programName,
    });

    if (payment.status !== "pending") {
      console.log("[approveAndGenerate] FAILED: Payment already", payment.status);
      return res.status(400).json({
        message: `Payment already ${payment.status}. Cannot approve a non-pending payment.`,
      });
    }
    console.log("[approveAndGenerate] Payment status is 'pending' - OK");

    console.log("[approveAndGenerate] Step 2: Updating payment status to 'approved'...");
    const updatedPayment = await CertificatePayment.findByIdAndUpdate(paymentId, {
      status: "approved",
      approvedAt: new Date(),
      approvedBy: req.user._id,
    }, { new: true });
    console.log("[approveAndGenerate] Payment status updated to 'approved':", updatedPayment._id);

    let certificate = null;
    let applicationUpdated = null;

    if (payment.application) {
      console.log("[approveAndGenerate] Step 3: Payment has application reference:", payment.application);
      console.log("[approveAndGenerate] Step 3a: Fetching application...");
      const app = await Application.findById(payment.application);
      if (app) {
        console.log("[approveAndGenerate] Application found:", {
          _id: app._id,
          status: app.status,
          totalScore: app.totalScore,
          certificateURL: app.certificateURL,
          student: app.student,
        });
      } else {
        console.log("[approveAndGenerate] WARNING: Application not found:", payment.application);
      }

      if (app) {
        console.log("[approveAndGenerate] Step 3b: Calling ensureCertificateForApplication...");
        try {
          applicationUpdated = await ensureCertificateForApplication(payment.application);
          console.log("[approveAndGenerate] ensureCertificateForApplication returned:", {
            status: applicationUpdated?.status,
            _id: applicationUpdated?._id,
            certificateURL: applicationUpdated?.certificateURL,
          });
        } catch (certErr) {
          console.error("[approveAndGenerate] Certificate generation error:", certErr.message, certErr.stack);
        }

        console.log("[approveAndGenerate] Step 3c: Fetching generated certificate record...");
        try {
          const { Certificate } = await import("../models/Certificate.js");
          certificate = await Certificate.findOne({ application: payment.application });
          if (certificate) {
            console.log("[approveAndGenerate] Certificate found/generated:", {
              _id: certificate._id,
              certificateId: certificate.certificateId,
              pdfURL: certificate.pdfURL,
              score: certificate.score,
              grade: certificate.grade,
            });
          } else {
            console.log("[approveAndGenerate] WARNING: No certificate record found after generation");
          }
        } catch (certFindErr) {
          console.error("[approveAndGenerate] Error finding certificate:", certFindErr.message);
        }
      }
    } else {
      console.log("[approveAndGenerate] Step 3: Payment has NO application reference - skipping certificate generation");
    }

    console.log("[approveAndGenerate] Step 4: Creating verification log entry...");
    let verificationLog = null;
    try {
      verificationLog = await VerificationLog.create({
        paymentId: payment._id,
        applicationId: payment.application || null,
        studentId: updatedPayment.student,
        certificateId: certificate?.certificateId || payment.certificateId || "",
        action: "approve_and_generate",
        performedBy: req.user._id,
        details: JSON.stringify({
          programName: payment.programName,
          transactionId: payment.transactionId,
          certificateGenerated: !!certificate,
          certificateURL: applicationUpdated?.certificateURL || "",
          timestamp: new Date().toISOString(),
        }),
      });
      console.log("[approveAndGenerate] Verification log created:", verificationLog._id);
    } catch (logErr) {
      console.error("[approveAndGenerate] Error creating verification log:", logErr.message, logErr.stack);
    }

    console.log("[approveAndGenerate] Step 5: Sending notification to student...");
    const studentId = updatedPayment.student;
    if (studentId) {
      try {
        await createNotification(studentId, {
          type: "system",
          title: "Payment approved & certificate generated",
          body: `Your ₹100 payment for ${updatedPayment.programName || "certificate"} has been approved. Your certificate is ready for download. Join our community on LinkedIn, Instagram, Telegram, or WhatsApp @ 9940773204.`,
          link: "/dashboard/certificate",
          meta: {
            paymentId: updatedPayment._id,
            status: "approved",
            certificateId: certificate?.certificateId || "",
            certificateURL: applicationUpdated?.certificateURL || "",
          },
        });
        console.log("[approveAndGenerate] Notification sent to student:", studentId);
      } catch (notifErr) {
        console.error("[approveAndGenerate] Error sending notification:", notifErr.message);
      }
    } else {
      console.log("[approveAndGenerate] No student ID found for notification");
    }

    emitEvent("payment_approved", { paymentId: updatedPayment._id, studentId: updatedPayment.student });
    if (certificate) {
      emitEvent("certificate_generated", { certificateId: certificate.certificateId, studentId: updatedPayment.student });
    }
    console.log("[approveAndGenerate] ===== COMPLETE =====");
    console.log("[approveAndGenerate] Result summary:", {
      paymentId: updatedPayment._id,
      paymentStatus: updatedPayment.status,
      certificateGenerated: !!certificate,
      certificateId: certificate?.certificateId || null,
      applicationStatus: applicationUpdated?.status || null,
      certificateURL: applicationUpdated?.certificateURL || null,
      verificationLogId: verificationLog?._id || null,
    });
    console.log("=".repeat(60));

    res.json({
      payment: updatedPayment,
      certificate,
      application: applicationUpdated,
      verificationLog,
    });
  } catch (err) {
    console.error("[approveAndGenerate] FATAL ERROR:", err.message, err.stack);
    next(err);
  }
}
