import { createModel } from "../config/modelFactory.js";

const TaskSubmission = createModel("task_submissions", {
  _id: "id",
  id: "id",
  student: "student_id",
  application: "application_id",
  task: "task_id",
  submissionContent: "submission_content",
  submissionFileUrl: "submission_file_url",
  status: "status",
  feedback: "feedback",
  score: "score",
  submittedAt: "submitted_at",
  reviewedAt: "reviewed_at",
  reviewedBy: "reviewed_by",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { TaskSubmission };
