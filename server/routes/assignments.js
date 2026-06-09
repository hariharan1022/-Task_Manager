import { Router } from "express";
import {
  listAssignments,
  submitAssignment,
  gradeSubmission,
  adminListSubmissions,
  adminListAssignments,
  adminCreateAssignment,
  adminUpdateAssignment,
  adminDeleteAssignment,
} from "../controllers/assignmentController.js";
import { authRequired } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.get("/course/:courseId", authRequired, listAssignments);
router.post("/:assignmentId/submit", authRequired, submitAssignment);
router.post("/submissions/:submissionId/grade", authRequired, isAdmin, gradeSubmission);

router.get("/admin/all", authRequired, isAdmin, adminListAssignments);
router.get("/admin/submissions", authRequired, isAdmin, adminListSubmissions);
router.post("/admin", authRequired, isAdmin, adminCreateAssignment);
router.put("/admin/:id", authRequired, isAdmin, adminUpdateAssignment);
router.delete("/admin/:id", authRequired, isAdmin, adminDeleteAssignment);

export default router;
