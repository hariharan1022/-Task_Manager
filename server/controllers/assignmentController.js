import { Assignment } from "../models/Assignment.js";
import { AssignmentSubmission } from "../models/AssignmentSubmission.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Result } from "../models/Result.js";

export async function listAssignments(req, res, next) {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.find({ course: courseId, isActive: true })
      .sort({ createdAt: 1 })
      .lean();
    const submissions = await AssignmentSubmission.find({
      user: req.user._id,
      assignment: { $in: assignments.map((a) => a._id) },
    }).lean();
    const submissionMap = Object.fromEntries(
      submissions.map((s) => [String(s.assignment), s])
    );
    const items = assignments.map((a) => ({
      ...a,
      submission: submissionMap[String(a._id)] || null,
    }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function submitAssignment(req, res, next) {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: assignment.course,
    });
    if (!enrollment) {
      return res.status(403).json({ message: "Enroll in the course first" });
    }

    const { fileUrl, fileName, content } = req.body;
    if (!fileUrl && !content) {
      return res
        .status(400)
        .json({ message: "Either a file upload or text content is required" });
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { user: req.user._id, assignment: assignment._id },
      {
        user: req.user._id,
        assignment: assignment._id,
        course: assignment.course,
        fileUrl: fileUrl || "",
        fileName: fileName || "",
        content: content || "",
        status: "submitted",
        submittedAt: new Date(),
        marks: null,
        feedback: "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ submission });
  } catch (err) {
    next(err);
  }
}

export async function gradeSubmission(req, res, next) {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;
    const existing = await AssignmentSubmission.findById(submissionId);
    if (!existing) return res.status(404).json({ message: "Submission not found" });

    const m = Number(marks);
    if (isNaN(m) || m < 0 || m > 50) {
      return res.status(400).json({ message: "Marks must be between 0 and 50" });
    }
    const submission = await AssignmentSubmission.findByIdAndUpdate(submissionId, {
      marks: m,
      feedback: feedback || "",
      status: "graded",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    }, { new: true });
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    await Result.findOneAndUpdate(
      { user: submission.user, course: submission.course },
      { $set: { assignmentMarks: m } },
      { upsert: true, new: true }
    );
    res.json({ submission });
  } catch (err) {
    next(err);
  }
}

export async function adminListSubmissions(req, res, next) {
  try {
    const { status, courseId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (courseId) filter.course = courseId;
    const submissions = await AssignmentSubmission.find(filter)
      .populate("user", "fullName email profilePhoto")
      .populate("assignment", "title maxMarks")
      .populate("course", "title slug")
      .sort({ submittedAt: -1 })
      .lean();
    res.json({ items: submissions });
  } catch (err) {
    next(err);
  }
}

export async function adminListAssignments(req, res, next) {
  try {
    const { courseId } = req.query;
    const filter = {};
    if (courseId) filter.course = courseId;
    const items = await Assignment.find(filter)
      .populate("course", "title slug")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateAssignment(req, res, next) {
  try {
    const assignment = await Assignment.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ assignment });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateAssignment(req, res, next) {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    res.json({ assignment });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteAssignment(req, res, next) {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    res.json({ message: "Assignment removed" });
  } catch (err) {
    next(err);
  }
}
