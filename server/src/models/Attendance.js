import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkIn: { type: Date },
    checkOut: { type: Date },
    source: { type: String, enum: ["web", "camera", "correction"], default: "web" },
    status: {
      type: String,
      enum: ["present", "late", "half_day", "absent", "missing_checkout", "on_leave"],
      default: "present",
    },
    workHours: { type: Number, default: 0 }, // computed
    isLate: { type: Boolean, default: false },
    lateMinutes: { type: Number, default: 0 },
    correctionReason: { type: String },
    correctionStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    correctionRequestedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    // camera attendance extras
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    faceDetected: { type: Boolean },
  },
  { timestamps: true }
);

// One record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
