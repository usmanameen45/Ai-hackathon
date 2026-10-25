import { AuditLog } from "../models/AuditLog.js";

/**
 * Log an important action to the audit trail.
 */
export async function audit({ actor, actorRole, actorName, action, entity, entityId, before, after, req }) {
  try {
    await AuditLog.create({
      actor,
      actorRole,
      actorName,
      action,
      entity,
      entityId: entityId?.toString(),
      before,
      after,
      ip: req?.ip,
      userAgent: req?.headers?.["user-agent"],
    });
  } catch (err) {
    // Non-fatal — never block the main flow
    console.error("Audit log failed:", err.message);
  }
}
