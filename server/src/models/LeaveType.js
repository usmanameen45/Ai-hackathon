import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // annual, sick, casual, unpaid
    code: { type: String, required: true, unique: true, lowercase: true },
    annualQuota: { type: Number, default: 0 }, // 0 = unlimited (for unpaid)
    isPaid: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);
