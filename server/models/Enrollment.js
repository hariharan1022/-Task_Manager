import { createModel } from "../config/modelFactory.js";

const Enrollment = createModel("enrollments", {
  _id: "id",
  id: "id",
  user: "user_id",
  course: "course_id",
  progress: "progress",
  completedLessons: "completed_lessons",
  lastLessonId: "last_lesson_id",
  lastPosition: "last_position",
  status: "status",
  completedAt: "completed_at",
  enrolledAt: "enrolled_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { Enrollment };
