import { Router } from "express";
import {
  register,
  verifyEmail,
  resendOtp,
  login,
  refresh,
  logout,
  me,
  ping,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/register", loginLimiter, register);
router.post("/verify-email", loginLimiter, verifyEmail);
router.post("/resend-otp", loginLimiter, resendOtp);
router.post("/login", loginLimiter, login);
router.post("/refresh", refresh);
router.post("/forgot-password", loginLimiter, forgotPassword);
router.post("/reset-password", loginLimiter, resetPassword);
router.post("/logout", authRequired, logout);
router.get("/me", authRequired, me);
router.post("/ping", authRequired, ping);

export default router;
