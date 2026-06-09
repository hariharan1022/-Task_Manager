import { Notification } from "../models/Notification.js";

export async function createNotification(studentId, { type = "system", title, body, link = "", meta = {} }) {
  if (!studentId || !title) return null;
  return Notification.create({
    student: studentId,
    type,
    title,
    body: body || "",
    link,
    meta,
  });
}
