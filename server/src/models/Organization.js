import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    officeStartTime: { type: String, default: "09:00" }, // HH:MM
    graceMinutes: { type: Number, default: 15 },
    halfDayHours: { type: Number, default: 5 },
    weekendDays: { type: [Number], default: [0, 6] }, // 0=Sun, 6=Sat
    officeLocation: {
      lat: { type: Number },
      lng: { type: Number },
      radius: { type: Number, default: 150 }, // meters
    },
    isSetup: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Organization = mongoose.model("Organization", organizationSchema);
