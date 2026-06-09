import { createModel } from "../config/modelFactory.js";

const ExamAttempt = createModel("exam_attempts", {
  _id: "id",
  id: "id",
  exam: "exam_id",
  user: "user_id",
  course: "course_id",
  answers: "answers",
  questionOrder: "question_order",
  totalQuestions: "total_questions",
  correctCount: "correct_count",
  score: "score",
  convertedMarks: "converted_marks",
  startedAt: "started_at",
  submittedAt: "submitted_at",
  timeSpent: "time_spent",
  status: "status",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { ExamAttempt };
