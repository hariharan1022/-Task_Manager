import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { adminDashboardStats, adminAnalytics } from "../controllers/adminController.js";
import { seedCourses } from "../seed/seedCourses.js";
import { upsertPrograms } from "../seed/seed.js";
import { InternshipProgram } from "../models/Internship.js";
import { Task } from "../models/Task.js";
import { Application } from "../models/Application.js";
import { TaskSubmission } from "../models/TaskSubmission.js";

const router = Router();

router.use(authRequired, isAdmin);

router.get("/stats", adminDashboardStats);
router.get("/analytics", adminAnalytics);
router.post("/seed-courses", async (req, res, next) => {
  try {
    const clear = req.query.clear === "true" || req.body?.clear === true;
    const result = await seedCourses({ clear });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});
router.post("/seed-programs", async (req, res, next) => {
  try {
    await upsertPrograms();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
router.post("/reseed-programs", async (req, res, next) => {
  try {
    const before = await InternshipProgram.countDocuments();
    await TaskSubmission.deleteMany({});
    await Application.deleteMany({});
    await Task.deleteMany({});
    await InternshipProgram.deleteMany({});
    await upsertPrograms();
    const after = await InternshipProgram.countDocuments();
    res.json({ success: true, removed: before, total: after });
  } catch (err) {
    next(err);
  }
});

export default router;
