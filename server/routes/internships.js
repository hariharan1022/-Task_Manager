import { Router } from "express";
import {
  listInternships,
  listInternshipsAdmin,
  getInternship,
  getInternshipAdmin,
  createInternship,
  updateInternship,
  deleteInternship,
} from "../controllers/internshipController.js";
import { authRequired } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.get("/admin/all", authRequired, isAdmin, listInternshipsAdmin);
router.get("/admin/:id", authRequired, isAdmin, getInternshipAdmin);
router.get("/", listInternships);
router.get("/:id", getInternship);
router.post("/", authRequired, isAdmin, createInternship);
router.put("/:id", authRequired, isAdmin, updateInternship);
router.delete("/:id", authRequired, isAdmin, deleteInternship);

export default router;
