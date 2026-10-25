import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema(
  {
    payrollRun: { type: mongoose.Schema.Types.ObjectId, ref: "PayrollRun", required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    // Earnings
    basic: { type: Number, required: true },
    hra: { type: Number, required: true }, // 40% of basic
    medical: { type: Number, required: true }, // 10% of basic
    gross: { type: Number, required: true }, // basic * 1.5
    // Working days
    workingDays: { type: Number, required: true },
    presentDays: { type: Number, required: true },
    absentDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    // Deductions
    absentDeduction: { type: Number, default: 0 },
    halfDayDeduction: { type: Number, default: 0 },
    unpaidLeaveDeduction: { type: Number, default: 0 },
    taxDeduction: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    // Net
    net: { type: Number, required: true },
    // Per day rate
    perDayRate: { type: Number, required: true },
  },
  { timestamps: true }
);

payslipSchema.index({ payrollRun: 1, employee: 1 }, { unique: true });

export const Payslip = mongoose.model("Payslip", payslipSchema);
