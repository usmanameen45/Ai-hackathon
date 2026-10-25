import mongoose from "mongoose";

const payrollRunSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // YYYY-MM
    department: { type: String, default: "All" },
    status: { type: String, enum: ["draft", "finalized"], default: "draft" },
    items: [
      {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
        basic: { type: Number, required: true },
        gross: { type: Number, required: true },
        deductions: { type: Number, required: true },
        tax: { type: Number, required: true },
        net: { type: Number, required: true },
        daysWorked: { type: Number, required: true },
        absentDays: { type: Number, default: 0 },
        halfDays: { type: Number, default: 0 },
      },
    ],
    finalizedBy: { type: String },
    finalizedAt: { type: Date },
  },
  { timestamps: true }
);

const PayrollRun = mongoose.model("PayrollRun", payrollRunSchema);

export default PayrollRun;
