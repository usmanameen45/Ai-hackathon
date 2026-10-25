import Employee from "./employee.model.js";
import { auth } from "../../config/auth.js";
import { ApiError } from "../../utils/ApiError.js";

export const listEmployees = async (req, res, next) => {
  try {
    const { search, department, status, page = 1, limit = 20 } = req.query;
    const query = {};

    // Data scoping: Employee can only view themselves
    if (req.auth.user.role === "employee") {
      const emp = await Employee.findOne({ userId: req.auth.user.id });
      return res.json({ employees: emp ? [emp] : [], total: emp ? 1 : 0 });
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { employeeId: new RegExp(search, "i") },
      ];
    }
    if (department) query.department = department;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [employees, total] = await Promise.all([
      Employee.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Employee.countDocuments(query),
    ]);

    res.json({ employees, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return next(new ApiError(404, "Employee not found"));

    // Scoping check
    if (req.auth.user.role === "employee" && employee.userId !== req.auth.user.id) {
      return next(new ApiError(403, "Forbidden"));
    }

    res.json({ employee });
  } catch (error) {
    next(error);
  }
};

export const registerEmployee = async (req, res, next) => {
  try {
    const { employeeId, name, email, password, department, designation, joinDate, salary, phone, address } = req.body;

    if (!employeeId || !name || !email || !password || !department || !designation) {
      return next(new ApiError(400, "Missing required employee fields"));
    }

    // Create Better Auth user
    const userResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        role: "employee",
      },
    }).catch(err => {
      throw new ApiError(400, err.message || "Failed to create user auth");
    });

    const userId = userResult.user.id;

    const employee = await Employee.create({
      userId,
      employeeId,
      name,
      email,
      department,
      designation,
      joinDate: joinDate || Date.now(),
      salary: salary || { basic: 50000, allowances: 10000 },
      phone: phone || "",
      address: address || "",
      status: "active",
    });

    res.status(201).json({ message: "Employee registered successfully", employee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const employee = await Employee.findById(id);
    if (!employee) return next(new ApiError(404, "Employee not found"));

    // Employee role can only update phone and address
    if (req.auth.user.role === "employee") {
      if (employee.userId !== req.auth.user.id) return next(new ApiError(403, "Forbidden"));
      employee.phone = updates.phone !== undefined ? updates.phone : employee.phone;
      employee.address = updates.address !== undefined ? updates.address : employee.address;
      await employee.save();
      return res.json({ message: "Profile updated successfully", employee });
    }

    // HR / Admin can update details and salary
    Object.assign(employee, updates);
    await employee.save();

    res.json({ message: "Employee updated successfully", employee });
  } catch (error) {
    next(error);
  }
};

export const csvImport = async (req, res, next) => {
  try {
    const { rows, dryRun = true } = req.body; // array of employee objects
    if (!Array.isArray(rows)) return next(new ApiError(400, "Rows array required"));

    const report = [];
    let validCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const errors = [];

      if (!r.employeeId) errors.push("Missing employeeId");
      if (!r.name) errors.push("Missing name");
      if (!r.email || !r.email.includes("@")) errors.push("Invalid email");
      if (!r.department) errors.push("Missing department");
      if (!r.designation) errors.push("Missing designation");
      if (r.salary && Number(r.salary) <= 0) errors.push("Salary must be > 0");

      const existing = await Employee.findOne({ $or: [{ employeeId: r.employeeId }, { email: r.email }] });
      if (existing) errors.push("Employee ID or email already exists");

      if (errors.length > 0) {
        errorCount++;
        report.push({ row: i + 1, data: r, status: "error", errors });
      } else {
        validCount++;
        report.push({ row: i + 1, data: r, status: "valid" });
      }
    }

    if (dryRun || errorCount > 0) {
      return res.json({ dryRun: true, validCount, errorCount, report });
    }

    // Execute import if not dryRun and 0 errors
    const created = [];
    for (const r of rows) {
      const tempPassword = "TempPassword123!";
      const userResult = await auth.api.signUpEmail({
        body: { email: r.email, password: tempPassword, name: r.name, role: "employee" },
      });

      const emp = await Employee.create({
        userId: userResult.user.id,
        employeeId: r.employeeId,
        name: r.name,
        email: r.email,
        department: r.department,
        designation: r.designation,
        salary: { basic: Number(r.salary) || 50000, allowances: Number(r.allowances) || 10000 },
        phone: r.phone || "",
        address: r.address || "",
      });
      created.push(emp);
    }

    res.json({ dryRun: false, importedCount: created.length, created });
  } catch (error) {
    next(error);
  }
};
