import mongoose from "mongoose";
import AuditLog from '../audit/audit.model.js';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetRole: { type: String, enum: ["all", "admin", "hr", "employee"], default: "all" },
    postedBy: { type: String, required: true },
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: String, required: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    beforeJSON: { type: Object },
    afterJSON: { type: Object },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
