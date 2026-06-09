import { createModel } from "../config/modelFactory.js";

const AssignmentSubmission = createModel("assignment_submissions", {
  _id: "id",
  id: "id",
  assignment: "assignment_id",
  user: "user_id",
  course: "course_id",
  fileUrl: "file_url",
  fileName: "file_name",
  content: "content",
  marks: "marks",
  feedback: "feedback",
  status: "status",
  reviewedBy: "reviewed_by",
  reviewedAt: "reviewed_at",
  submittedAt: "submitted_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { AssignmentSubmission };
