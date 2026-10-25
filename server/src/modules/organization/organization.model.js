import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    officeHours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" },
    },
    graceTime: { type: Number, default: 15 }, // in minutes
    weekends: { type: [String], default: ["Saturday", "Sunday"] },
    location: {
      lat: { type: Number, default: 24.8607 },
      lng: { type: Number, default: 67.0011 },
      radius: { type: Number, default: 150 }, // in meters
    },
    departments: [{ type: String }],
    designations: [{ type: String }],
    leaveTypes: [
      {
        name: { type: String, required: true },
        quota: { type: Number, required: true },
      },
    ],
    holidays: [
      {
        name: { type: String },
        date: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
