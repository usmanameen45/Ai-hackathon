import mongoose from "mongoose";

const payrollRunSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    status: { type: String, enum: ["draft", "finalized"], default: "draft" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    finalizedAt: { type: Date },
    totalGross: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    workingDays: { type: Number, required: true },
  },
  { timestamps: true }
);

payrollRunSchema.index({ month: 1, year: 1 }, { unique: true });

export const PayrollRun = mongoose.model("PayrollRun", payrollRunSchema);
