import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true }, // userId
    actorRole: { type: String },
    actorName: { type: String },
    action: {
      type: String,
      required: true,
      // e.g. "create", "update", "delete", "approve", "reject", "finalize", "login"
    },
    entity: { type: String, required: true }, // e.g. "Employee", "LeaveRequest", "PayrollRun"
    entityId: { type: String },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
