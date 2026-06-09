import { Router } from "express";
import {
  listExams,
  startExam,
  submitExam,
  myResults,
  courseResult,
  adminListExams,
  adminCreateExam,
  adminUpdateExam,
  adminDeleteExam,
  adminListQuestions,
  adminAddQuestion,
  adminBulkAddQuestions,
  adminUpdateQuestion,
  adminDeleteQuestion,
} from "../controllers/examController.js";
import { authRequired } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.get("/my-results", authRequired, myResults);
router.get("/course/:courseId", authRequired, listExams);
router.get("/course/:courseId/result", authRequired, courseResult);
router.get("/:examId/start", authRequired, startExam);
router.post("/:examId/submit", authRequired, submitExam);

router.get("/admin/all", authRequired, isAdmin, adminListExams);
router.post("/admin", authRequired, isAdmin, adminCreateExam);
router.put("/admin/:id", authRequired, isAdmin, adminUpdateExam);
router.delete("/admin/:id", authRequired, isAdmin, adminDeleteExam);
router.get("/admin/:examId/questions", authRequired, isAdmin, adminListQuestions);
router.post("/admin/:examId/questions", authRequired, isAdmin, adminAddQuestion);
router.post(
  "/admin/:examId/questions/bulk",
  authRequired,
  isAdmin,
  adminBulkAddQuestions
);
router.put(
  "/admin/questions/:questionId",
  authRequired,
  isAdmin,
  adminUpdateQuestion
);
router.delete(
  "/admin/questions/:questionId",
  authRequired,
  isAdmin,
  adminDeleteQuestion
);

export default router;
