import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true }, // Better Auth user id
    employeeCode: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    address: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirth: { type: String }, // ISO date
    joiningDate: { type: String, required: true }, // ISO date
    leavingDate: { type: String }, // ISO date, null if still employed
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    designation: { type: mongoose.Schema.Types.ObjectId, ref: "Designation", required: true },
    salary: {
      basic: { type: Number, required: true, min: 1 },
    },
    status: {
      type: String,
      enum: ["active", "probation", "inactive"],
      default: "active",
    },
    mustChangePassword: { type: Boolean, default: true },
    profilePhoto: { type: String }, // URL
    faceDescriptor: { type: [Number] }, // for face recognition
  },
  { timestamps: true }
);

employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.set("toJSON", { virtuals: true });

export const Employee = mongoose.model("Employee", employeeSchema);
