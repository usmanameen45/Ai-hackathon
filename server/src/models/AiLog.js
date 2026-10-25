import mongoose from "mongoose";

const aiLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userRole: { type: String },
    prompt: { type: String, required: true },
    toolsUsed: { type: [String] },
    response: { type: String },
    durationMs: { type: Number },
    error: { type: String },
  },
  { timestamps: true }
);

export const AiLog = mongoose.model("AiLog", aiLogSchema);
