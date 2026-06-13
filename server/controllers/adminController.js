import { User } from "../models/User.js";
import { InternshipProgram } from "../models/Internship.js";
import { Application } from "../models/Application.js";
import { TaskSubmission } from "../models/TaskSubmission.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { AssignmentSubmission } from "../models/AssignmentSubmission.js";
import { ExamAttempt } from "../models/ExamAttempt.js";
import { Result } from "../models/Result.js";
import { Certificate } from "../models/Certificate.js";
import { CertificatePayment } from "../models/CertificatePayment.js";
import { Notification } from "../models/Notification.js";

export async function adminDashboardStats(req, res, next) {
  try {
    console.time("[dashboardStats] db queries");
    const [
      totalStudents,
      activePrograms,
      pendingApplications,
      acceptedApplications,
      pendingSubmissions,
      completedPrograms,
      totalCourses,
      totalEnrollments,
      pendingAssignmentSubmissions,
      completedExams,
      totalResults,
      passedResults,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      InternshipProgram.countDocuments({ isActive: true }),
      Application.countDocuments({ status: "pending" }),
      Application.countDocuments({ status: { $in: ["accepted", "completed"] } }),
      TaskSubmission.countDocuments({ status: "submitted" }),
      Application.countDocuments({ status: "completed" }),
      Course.countDocuments({ isPublished: true }),
      Enrollment.countDocuments(),
      AssignmentSubmission.countDocuments({ status: "submitted" }),
      ExamAttempt.countDocuments({ status: "completed" }),
      Result.countDocuments(),
      Result.countDocuments({ status: "passed" }),
    ]);
    console.timeEnd("[dashboardStats] db queries");

    res.json({
      totalStudents,
      activePrograms,
      pendingApplications,
      acceptedApplications,
      pendingSubmissions,
      completedPrograms,
      totalCourses,
      totalEnrollments,
      pendingAssignmentSubmissions,
      completedExams,
      totalResults,
      passedResults,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminDashboardStatsV2(req, res, next) {
  try {
    console.log("[dashboardStatsV2] ===== FETCHING DASHBOARD STATS =====");
    console.time("[dashboardStatsV2] total db time");

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      userRegistrationsToday,
      totalInternships,
      totalCourses,
      totalCertificates,
      pendingPayments,
      totalApplications,
      completedApplications,
      pendingSubmissions,
      passedResults,
      totalEnrollments,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }).then((c) => {
        console.log("[dashboardStatsV2] totalUsers:", c);
        return c;
      }),
      User.countDocuments({ role: "student", lastActiveAt: { $gte: twentyFourHoursAgo } }).then((c) => {
        console.log("[dashboardStatsV2] activeUsers (24h):", c);
        return c;
      }),
      User.countDocuments({ role: "student", createdAt: { $gte: startOfToday } }).then((c) => {
        console.log("[dashboardStatsV2] userRegistrationsToday:", c);
        return c;
      }),
      InternshipProgram.countDocuments({ isActive: true }).then((c) => {
        console.log("[dashboardStatsV2] totalInternships:", c);
        return c;
      }),
      Course.countDocuments({ isPublished: true }).then((c) => {
        console.log("[dashboardStatsV2] totalCourses:", c);
        return c;
      }),
      Certificate.countDocuments().then((c) => {
        console.log("[dashboardStatsV2] totalCertificates:", c);
        return c;
      }),
      CertificatePayment.countDocuments({ status: "pending" }).then((c) => {
        console.log("[dashboardStatsV2] pendingPayments:", c);
        return c;
      }),
      Application.countDocuments().then((c) => {
        console.log("[dashboardStatsV2] totalApplications:", c);
        return c;
      }),
      Application.countDocuments({ status: "completed" }).then((c) => {
        console.log("[dashboardStatsV2] completedApplications:", c);
        return c;
      }),
      TaskSubmission.countDocuments({ status: "submitted" }).then((c) => {
        console.log("[dashboardStatsV2] pendingSubmissions:", c);
        return c;
      }),
      Result.countDocuments({ status: "passed" }).then((c) => {
        console.log("[dashboardStatsV2] passedResults:", c);
        return c;
      }),
      Enrollment.countDocuments().then((c) => {
        console.log("[dashboardStatsV2] totalEnrollments:", c);
        return c;
      }),
      Notification.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .then((items) => {
          console.log("[dashboardStatsV2] recentActivities count:", items.length);
          return items.map((n) => ({
            id: n._id,
            type: n.type,
            title: n.title,
            body: n.body,
            link: n.link,
            createdAt: n.createdAt,
          }));
        }),
    ]);

    const completionRate = totalApplications > 0
      ? Math.round((completedApplications / totalApplications) * 100)
      : 0;
    console.log("[dashboardStatsV2] completionRate:", completionRate + "%");

    console.timeEnd("[dashboardStatsV2] total db time");
    console.log("[dashboardStatsV2] ===== DONE =====");

    res.json({
      totalUsers,
      activeUsers,
      userRegistrations: userRegistrationsToday,
      completionRate,
      totalCourses,
      totalInternships,
      totalCertificates,
      pendingPayments,
      pendingSubmissions,
      totalEnrollments,
      passedResults,
      recentActivities,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[dashboardStatsV2] ERROR:", err.message, err.stack);
    next(err);
  }
}

export async function adminAnalytics(req, res, next) {
  try {
    const [topCourses, recentResults, scoreDistribution] = await Promise.all([
      Course.find({ isPublished: true })
        .sort({ enrolledCount: -1 })
        .limit(5)
        .select("title thumbnail enrolledCount rating category")
        .lean(),
      Result.find()
        .populate("user", "full_name email")
        .populate("course", "title")
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      Result.aggregate([
        {
          $bucket: {
            groupBy: "$totalScore",
            boundaries: [0, 50, 60, 70, 80, 90, 101],
            default: "Other",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ]);

    res.json({ topCourses, recentResults, scoreDistribution });
  } catch (err) {
    next(err);
  }
}
