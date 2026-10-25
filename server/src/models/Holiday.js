import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // ISO date YYYY-MM-DD
    year: { type: Number, required: true },
    isRecurring: { type: Boolean, default: false },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });

export const Holiday = mongoose.model("Holiday", holidaySchema);
