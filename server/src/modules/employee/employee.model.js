import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    joinDate: { type: Date, default: Date.now },
    salary: {
      basic: { type: Number, required: true, default: 0 },
      allowances: { type: Number, default: 0 },
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    status: { type: String, enum: ["active", "probation", "exited"], default: "active" },
    faceDescriptor: { type: [Number], default: [] },
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
