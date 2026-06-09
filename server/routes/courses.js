import { Router } from "express";
import {
  listCourses,
  getCourse,
  listCategories,
  enrollCourse,
  myEnrollments,
  getCourseLearning,
  markLessonComplete,
  updateLessonProgress,
  adminListCourses,
  adminGetCourse,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminAddModule,
  adminAddLesson,
  adminDeleteLesson,
  adminDeleteModule,
} from "../controllers/courseController.js";
import { authRequired } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.get("/categories", listCategories);
router.get("/", listCourses);
router.get("/my", authRequired, myEnrollments);
router.get("/admin/all", authRequired, isAdmin, adminListCourses);
router.get("/admin/:id", authRequired, isAdmin, adminGetCourse);
router.post("/", authRequired, isAdmin, adminCreateCourse);
router.put("/:id", authRequired, isAdmin, adminUpdateCourse);
router.delete("/:id", authRequired, isAdmin, adminDeleteCourse);
router.post("/:id/modules", authRequired, isAdmin, adminAddModule);
router.delete("/:id/modules/:moduleId", authRequired, isAdmin, adminDeleteModule);
router.post(
  "/:id/modules/:moduleId/lessons",
  authRequired,
  isAdmin,
  adminAddLesson
);
router.delete(
  "/:id/modules/:moduleId/lessons/:lessonId",
  authRequired,
  isAdmin,
  adminDeleteLesson
);
router.get("/:id", getCourse);
router.post("/:id/enroll", authRequired, enrollCourse);
router.get("/:courseId/learning/:lessonId?", authRequired, getCourseLearning);
router.post(
  "/:courseId/lessons/:lessonId/complete",
  authRequired,
  markLessonComplete
);
router.post(
  "/:courseId/lessons/:lessonId/progress",
  authRequired,
  updateLessonProgress
);

export default router;
