import { User } from "../models/User.js";
import { InternshipProgram } from "../models/Internship.js";
import { Application } from "../models/Application.js";
import { TaskSubmission } from "../models/TaskSubmission.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { AssignmentSubmission } from "../models/AssignmentSubmission.js";
import { ExamAttempt } from "../models/ExamAttempt.js";
import { Result } from "../models/Result.js";

export async function adminDashboardStats(req, res, next) {
  try {
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

export async function adminAnalytics(req, res, next) {
  try {
    const [topCourses, recentResults, scoreDistribution] = await Promise.all([
      Course.find({ isPublished: true })
        .sort({ enrolledCount: -1 })
        .limit(5)
        .select("title thumbnail enrolledCount rating category")
        .lean(),
      Result.find()
        .populate("user", "fullName email")
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
