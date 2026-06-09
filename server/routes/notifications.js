import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = Router();

router.get("/", authRequired, listMyNotifications);
router.patch("/read-all", authRequired, markAllNotificationsRead);
router.patch("/:id/read", authRequired, markNotificationRead);

export default router;
