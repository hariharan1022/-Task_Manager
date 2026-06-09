import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { connectDB, isDBConnected } from "./config/db.js";
import { User } from "./models/User.js";
import { Course } from "./models/Course.js";
import { seedDatabase } from "./seed/seed.js";
import { seedCourses } from "./seed/seedCourses.js";

import authRoutes from "./routes/auth.js";
import internshipRoutes from "./routes/internships.js";
import applicationRoutes from "./routes/applications.js";
import userRoutes from "./routes/users.js";
import taskRoutes from "./routes/tasks.js";
import miscRoutes from "./routes/misc.js";
import statsRoutes from "./routes/stats.js";
import adminRoutes from "./routes/admin.js";
import verifyRoutes from "./routes/verify.js";
import notificationRoutes from "./routes/notifications.js";
import courseRoutes from "./routes/courses.js";
import assignmentRoutes from "./routes/assignments.js";
import examRoutes from "./routes/exams.js";

import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requireDB } from "./middleware/requireDB.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
const allowedOrigins = [
  env.clientUrl,
  "http://localhost:5173",
  "https://hariharan1022.github.io",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.endsWith(".github.io")) return callback(null, true);
      if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== "test") app.use(morgan("dev"));
app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadsDir)));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: env.nodeEnv,
    db: isDBConnected() ? "connected" : "disconnected",
    time: new Date().toISOString(),
  });
});

app.use("/api/stats", statsRoutes);
app.use("/api/admin", requireDB, adminRoutes);
app.use("/api/auth", requireDB, authRoutes);
app.use("/api/internships", requireDB, internshipRoutes);
app.use("/api/applications", requireDB, applicationRoutes);
app.use("/api/users", requireDB, userRoutes);
app.use("/api/tasks", requireDB, taskRoutes);
app.use("/api/verify", requireDB, verifyRoutes);
app.use("/api/certificates", requireDB, miscRoutes);
app.use("/api/notifications", requireDB, notificationRoutes);
app.use("/api/courses", requireDB, courseRoutes);
app.use("/api/assignments", requireDB, assignmentRoutes);
app.use("/api/exams", requireDB, examRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  if (isDBConnected()) {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("[seed] Empty Supabase database — loading demo data…");
      try {
        await seedDatabase({ clear: false });
      } catch (e) {
        console.error("[seed] Error seeding database:", e?.message || e, JSON.stringify(e, Object.getOwnPropertyNames(e)));
      }
      const courseCount = await Course.countDocuments();
      if (courseCount === 0) {
        console.log("[seed] Seeding courses…");
        try {
          await seedCourses({ clear: false });
        } catch (e) {
          console.error("[seed] Error seeding courses:", e?.message || e, JSON.stringify(e, Object.getOwnPropertyNames(e)));
        }
      }
    }
  }
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
};

start();
