import Organization from "./organization.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { auth } from "../../config/auth.js";
import { audit } from "../../utils/audit.js";

export const getOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findOne();
    if (!org) {
      return res.json({ isFirstRun: true });
    }
    res.json({ isFirstRun: false, organization: org });
  } catch (error) {
    next(error);
  }
};

export const setupOrganization = async (req, res, next) => {
  try {
    const existingOrg = await Organization.findOne();
    if (existingOrg) {
      return next(new ApiError(400, "Organization already setup"));
    }

    const { name, adminEmail, adminPassword, adminName } = req.body;

    if (!name || !adminEmail || !adminPassword || !adminName) {
      return next(new ApiError(400, "Missing required fields: name, adminEmail, adminPassword, adminName"));
    }

    if (adminPassword.length < 8) {
      return next(new ApiError(400, "Password must be at least 8 characters"));
    }

    // Create Organization with default leave types and settings
    const org = await Organization.create({
      name,
      officeHours: { start: "09:00", end: "18:00" },
      graceTime: 15,
      weekends: ["Saturday", "Sunday"],
      leaveTypes: [
        { name: "Annual", quota: 14 },
        { name: "Sick", quota: 8 },
        { name: "Casual", quota: 10 },
        { name: "Unpaid", quota: 0 },
      ],
      departments: [],
      designations: [],
      holidays: [],
    });

    // Create Admin User using Better Auth
    let user;
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: adminName,
          role: "admin",
        },
      });
      user = result.user;
    } catch (err) {
      // Rollback org creation if admin user fails
      await Organization.findByIdAndDelete(org._id);
      throw new ApiError(400, err.message || "Failed to create admin account");
    }

    await audit({
      actor: user.id,
      actorRole: "admin",
      actorName: adminName,
      action: "create",
      entity: "Organization",
      entityId: org._id,
      after: { name, adminEmail },
    });

    res.status(201).json({
      message: "Organization and Admin account created successfully",
      organization: org,
      admin: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { name, officeHours, graceTime, weekends, location, leaveTypes, holidays, departments, designations } = req.body;

    const update = {};
    if (name) update.name = name;
    if (officeHours) update.officeHours = officeHours;
    if (graceTime !== undefined) update.graceTime = graceTime;
    if (weekends) update.weekends = weekends;
    if (location) update.location = location;
    if (leaveTypes) update.leaveTypes = leaveTypes;
    if (holidays) update.holidays = holidays;
    if (departments) update.departments = departments;
    if (designations) update.designations = designations;

    const org = await Organization.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
    });

    await audit({
      actor: req.auth.user.id,
      actorRole: req.auth.user.role,
      actorName: req.auth.user.name,
      action: "update",
      entity: "Organization",
      entityId: org._id,
      after: update,
      req,
    });

    res.json({ message: "Settings updated", organization: org });
  } catch (error) {
    next(error);
  }
};
