import { Router } from "express";
import { Task } from "../models/Task.js";
import { TaskSubmission } from "../models/TaskSubmission.js";
import { Application } from "../models/Application.js";
import { authRequired } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { ensureCertificateForApplication } from "../utils/issueCertificate.js";
import { createNotification } from "../utils/createNotification.js";

const router = Router();

router.get("/internship/:internshipId", authRequired, async (req, res, next) => {
  try {
    const tasks = await Task.find({ internship: req.params.internshipId }).sort({
      taskNumber: 1,
    });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.post("/:taskId/submit", authRequired, async (req, res, next) => {
  try {
    const { submissionContent, submissionFileUrl } = req.body;
    if (!submissionContent) {
      return res.status(400).json({ message: "submissionContent is required" });
    }
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const application = await Application.findOne({
      student: req.user._id,
      internship: task.internship,
    });
    if (!application || application.status === "pending" || application.status === "rejected") {
      return res
        .status(403)
        .json({ message: "You must be accepted for this internship to submit tasks" });
    }

    if (!application.offerLetterLinkedInPost) {
      return res.status(403).json({
        message:
          "Post your offer letter on LinkedIn and submit the post link from your Offer Letter page to unlock tasks.",
        code: "LINKEDIN_REQUIRED",
      });
    }

    const existing = await TaskSubmission.findOne({
      application: application._id,
      task: task._id,
    });
    if (existing && existing.status === "approved") {
      return res
        .status(409)
        .json({ message: "Task already approved" });
    }

    let submission;
    if (existing) {
      existing.submissionContent = submissionContent;
      existing.submissionFileUrl = submissionFileUrl || "";
      existing.status = "submitted";
      existing.submittedAt = new Date();
      existing.feedback = "";
      existing.score = 0;
      await existing.save();
      submission = existing;
    } else {
      submission = await TaskSubmission.create({
        student: req.user._id,
        application: application._id,
        task: task._id,
        submissionContent,
        submissionFileUrl: submissionFileUrl || "",
      });
    }
    res.status(201).json({ submission });
  } catch (err) {
    next(err);
  }
});

router.get("/submissions/my/:applicationId", authRequired, async (req, res, next) => {
  try {
    const items = await TaskSubmission.find({
      student: req.user._id,
      application: req.params.applicationId,
    }).populate("task", "title taskNumber points submissionType");
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get("/submissions", authRequired, isAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const items = await TaskSubmission.find(filter)
      .populate("student", "fullName email college department")
      .populate("task", "title taskNumber points submissionType")
      .populate({
        path: "application",
        select: "status totalScore internship",
        populate: { path: "internship", select: "title domain" },
      })
      .sort({ submittedAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.put("/submissions/:id/review", authRequired, isAdmin, async (req, res, next) => {
  try {
    const { status, feedback, score } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be approved or rejected" });
    }
    const submission = await TaskSubmission.findById(req.params.id)
      .populate("task", "title taskNumber points")
      .populate({
        path: "application",
        populate: { path: "internship", select: "title" },
      });
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    submission.status = status;
    submission.feedback = feedback || "";
    submission.score = status === "approved" ? Number(score ?? submission.task.points) : 0;
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.user._id;
    await submission.save();

    const studentId = submission.student || submission.application?.student;
    const taskLabel = submission.task?.title || `Task ${submission.task?.taskNumber || ""}`;
    const programTitle = submission.application?.internship?.title || "your internship";

    if (studentId) {
      if (status === "approved") {
        await createNotification(studentId, {
          type: "task",
          title: "Task approved",
          body: `"${taskLabel}" was approved (${submission.score} pts).${
            feedback ? ` Feedback: ${feedback}` : ""
          }`,
          link: "/dashboard/tasks",
          meta: { submissionId: submission._id, score: submission.score },
        });
      } else {
        await createNotification(studentId, {
          type: "task",
          title: "Task needs revision",
          body: `"${taskLabel}" was not approved.${feedback ? ` ${feedback}` : " Please resubmit."}`,
          link: "/dashboard/tasks",
          meta: { submissionId: submission._id },
        });
      }
    }

    if (status === "approved" && submission.application) {
      const allSubs = await TaskSubmission.find({
        application: submission.application._id,
        status: "approved",
      });
      const totalScore = allSubs.reduce((s, x) => s + (x.score || 0), 0);
      const updated = await Application.findByIdAndUpdate(
        submission.application._id,
        { totalScore },
        { new: true }
      );
      if (updated && totalScore >= 100) {
        const completed = await ensureCertificateForApplication(updated._id);
        if (completed?.status === "completed" && studentId) {
          await createNotification(studentId, {
            type: "application",
            title: "Certificate unlocked",
            body: `You completed all tasks for ${programTitle}. Download your certificate now.`,
            link: "/dashboard/certificate",
            meta: { applicationId: updated._id },
          });
        } else if (studentId) {
          await createNotification(studentId, {
            type: "task",
            title: "Score updated",
            body: `Your overall score for ${programTitle} is now ${totalScore}/100.`,
            link: "/dashboard/tasks",
            meta: { totalScore },
          });
        }
      }
    }
    res.json({ submission });
  } catch (err) {
    next(err);
  }
});

export default router;
