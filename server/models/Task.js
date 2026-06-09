import { createModel } from "../config/modelFactory.js";

const Task = createModel("tasks", {
  _id: "id",
  id: "id",
  internship: "internship_id",
  taskNumber: "task_number",
  title: "title",
  description: "description",
  instructions: "instructions",
  submissionType: "submission_type",
  dueInDays: "due_in_days",
  points: "points",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { Task };
