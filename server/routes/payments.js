import { Router } from "express";
import {
  submitPayment,
  myPayments,
  adminListPayments,
  adminPaymentStats,
  approvePayment,
  rejectPayment,
  approvePaymentAndGenerateCertificate,
} from "../controllers/paymentController.js";
import { authRequired } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.post("/submit", authRequired, submitPayment);
router.get("/my", authRequired, myPayments);
router.get("/admin", authRequired, isAdmin, adminListPayments);
router.get("/admin/stats", authRequired, isAdmin, adminPaymentStats);
router.put("/admin/:id/approve", authRequired, isAdmin, approvePayment);
router.put("/admin/:id/approve-and-generate", authRequired, isAdmin, approvePaymentAndGenerateCertificate);
router.put("/admin/:id/reject", authRequired, isAdmin, rejectPayment);

export default router;
