import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: {
      type: String,
      enum: ["present", "late", "absent", "half_day", "missing_checkout"],
      default: "present",
    },
    source: { type: String, enum: ["web", "camera"], default: "web" },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      distance: { type: Number },
    },
    correctionRequested: { type: Boolean, default: false },
    correctionReason: { type: String, default: "" },
    correctionStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    correctionComment: { type: String, default: "" },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
