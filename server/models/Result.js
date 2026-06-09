import { createModel } from "../config/modelFactory.js";

const Result = createModel("results", {
  _id: "id",
  id: "id",
  user: "user_id",
  course: "course_id",
  assignmentMarks: "assignment_marks",
  examMarks: "exam_marks",
  totalScore: "total_score",
  grade: "grade",
  status: "status",
  completedAt: "completed_at",
  certificateIssued: "certificate_issued",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

Result.calculateGrade = function (totalScore) {
  if (totalScore >= 90) return "A+";
  if (totalScore >= 80) return "A";
  if (totalScore >= 70) return "B+";
  if (totalScore >= 60) return "B";
  if (totalScore >= 50) return "C";
  return "Fail";
};

export { Result };
