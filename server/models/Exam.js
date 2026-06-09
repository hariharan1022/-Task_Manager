import { createModel } from "../config/modelFactory.js";

const Exam = createModel("exams", {
  _id: "id",
  id: "id",
  course: "course_id",
  title: "title",
  description: "description",
  totalQuestions: "total_questions",
  duration: "duration",
  totalMarks: "total_marks",
  convertedMarks: "converted_marks",
  passingMarks: "passing_marks",
  shuffleQuestions: "shuffle_questions",
  startDate: "start_date",
  endDate: "end_date",
  isActive: "is_active",
  createdBy: "created_by",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

const Question = createModel("questions", {
  _id: "id",
  id: "id",
  exam: "exam_id",
  question: "question",
  options: "options",
  correctAnswer: "correct_answer",
  explanation: "explanation",
  marks: "marks",
  order: "order",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { Exam, Question };
