import { createModel } from "../config/modelFactory.js";

const Assignment = createModel("assignments", {
  _id: "id",
  id: "id",
  course: "course_id",
  title: "title",
  description: "description",
  instructions: "instructions",
  maxMarks: "max_marks",
  dueDate: "due_date",
  attachments: "attachments",
  isActive: "is_active",
  createdBy: "created_by",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { Assignment };
