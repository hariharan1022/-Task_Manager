import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const isDev = env.nodeEnv === "development";

const tooManyMessage = {
  message: "Too many attempts. Please wait a few minutes and try again.",
};

/** Brute-force protection on credential endpoints only (not refresh/me). */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: tooManyMessage,
});
