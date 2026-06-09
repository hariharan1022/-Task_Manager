import { Notification } from "../models/Notification.js";

export async function listMyNotifications(req, res, next) {
  try {
    const items = await Notification.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .limit(80);
    const unreadCount = await Notification.countDocuments({
      student: req.user._id,
      read: false,
    });
    res.json({ items, unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const note = await Notification.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      { read: true },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification: note });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { student: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: "All marked as read" });
  } catch (err) {
    next(err);
  }
}
