import { createModel } from "../config/modelFactory.js";

const LessonProgress = createModel("lesson_progress", {
  _id: "id",
  id: "id",
  user: "user_id",
  course: "course_id",
  moduleId: "module_id",
  lessonId: "lesson_id",
  completed: "completed",
  watchTime: "watch_time",
  lastPosition: "last_position",
  completedAt: "completed_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { LessonProgress };
