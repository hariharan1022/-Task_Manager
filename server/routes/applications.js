import { Router } from "express";
import {
  applyForInternship,
  myApplications,
  listAllApplications,
  leaderboard,
  updateApplicationStatus,
  submitOfferLinkedInPost,
  getApplicationCertificate,
} from "../controllers/applicationController.js";
import { authRequired } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.post("/", authRequired, applyForInternship);
router.patch("/:id/offer-linkedin", authRequired, submitOfferLinkedInPost);
router.get("/my", authRequired, myApplications);
router.get("/:id/certificate", authRequired, getApplicationCertificate);
router.get("/leaderboard", authRequired, leaderboard);
router.get("/", authRequired, isAdmin, listAllApplications);
router.put("/:id/status", authRequired, isAdmin, updateApplicationStatus);

export default router;
