import { Announcement, Notification, AuditLog } from "./comms.model.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (error) {
    next(error);
  }
};

export const postAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetRole } = req.body;
    if (!title || !content) return next(new ApiError(400, "Title and content required"));

    const ann = await Announcement.create({
      title,
      content,
      targetRole: targetRole || "all",
      postedBy: req.auth.user.email,
    });

    res.status(201).json({ message: "Announcement posted", announcement: ann });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.auth.user.id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ auditLogs: logs });
  } catch (error) {
    next(error);
  }
};
