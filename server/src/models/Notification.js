import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    type: {
      type: String,
      enum: ["leave_approved", "leave_rejected", "payslip_ready", "correction_approved", "correction_rejected", "general"],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // leave request or payslip id
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
