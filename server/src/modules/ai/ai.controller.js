import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import Employee from "../employee/employee.model.js";
import Attendance from "../attendance/attendance.model.js";
import LeaveRequest from "../leave/leave.model.js";
import PayrollRun from "../payroll/payroll.model.js";
import Organization from "../organization/organization.model.js";
import { AiLog } from "../../models/AiLog.js";
import { ApiError } from "../../utils/ApiError.js";

// Per-user rate limiting (in-memory, simple)
const rateLimitMap = new Map();
const RATE_LIMIT = 20; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId) || { count: 0, resetAt: now + RATE_WINDOW };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW;
  }
  entry.count++;
  rateLimitMap.set(userId, entry);
  return entry.count <= RATE_LIMIT;
}

// ---- Tool implementations ----
async function get_headcount(role, employeeId) {
  const total = await Employee.countDocuments({ status: "active" });
  const byDept = await Employee.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
  ]);
  return { total, byDepartment: byDept };
}

async function get_attendance_summary(role, employeeId, date) {
  const dateStr = date || new Date().toISOString().slice(0, 10);
  const query = role === "employee" ? { date: dateStr, employee: employeeId } : { date: dateStr };
  const records = await Attendance.find(query);
  const summary = {
    date: dateStr,
    present: records.filter((r) => r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    absent: records.filter((r) => r.status === "absent").length,
    half_day: records.filter((r) => r.status === "half_day").length,
    on_leave: records.filter((r) => r.status === "on_leave").length,
  };
  return summary;
}

async function get_late_comers(role, month) {
  const monthStr = month || new Date().toISOString().slice(0, 7);
  const records = await Attendance.find({
    date: { $regex: `^${monthStr}` },
    status: "late",
  }).populate("employee", "name department");

  const countMap = {};
  for (const r of records) {
    const key = r.employee?._id?.toString();
    if (!key) continue;
    if (!countMap[key]) countMap[key] = { name: r.employee.name, department: r.employee.department, count: 0 };
    countMap[key].count++;
  }

  return Object.values(countMap).sort((a, b) => b.count - a.count).slice(0, 10);
}

async function get_leave_summary(role, employeeId, month) {
  const monthStr = month || new Date().toISOString().slice(0, 7);
  const query = role === "employee" ? { employee: employeeId, startDate: { $regex: `^${monthStr}` } }
    : { startDate: { $regex: `^${monthStr}` } };
  const leaves = await LeaveRequest.find(query).populate("leaveType", "name");
  return {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };
}

async function get_my_leave_balance(employeeId) {
  const LeaveType = (await import("../../models/LeaveType.js")).LeaveType;
  const leaveTypes = await LeaveType.find({ isActive: true });
  const balances = [];
  for (const lt of leaveTypes) {
    if (lt.code === "unpaid") {
      balances.push({ type: lt.name, quota: "Unlimited", used: 0, remaining: "Unlimited" });
      continue;
    }
    const approved = await LeaveRequest.find({ employee: employeeId, leaveType: lt._id, status: "approved" });
    const used = approved.reduce((s, l) => s + l.workingDays, 0);
    balances.push({ type: lt.name, quota: lt.annualQuota, used, remaining: Math.max(0, lt.annualQuota - used) });
  }
  return balances;
}

async function get_payroll_summary(role, month) {
  const monthStr = month || new Date().toISOString().slice(0, 7);
  const [m, y] = monthStr.split("-").map(Number);
  const run = await PayrollRun.findOne({ month: m, year: y });
  if (!run) return { message: "No payroll run found for this month" };
  return {
    month: monthStr,
    status: run.status,
    totalGross: run.totalGross,
    totalNet: run.totalNet,
  };
}

async function search_employees(role, q) {
  if (role === "employee") return { message: "Access denied" };
  const emps = await Employee.find({
    $or: [
      { firstName: new RegExp(q, "i") },
      { lastName: new RegExp(q, "i") },
      { employeeCode: new RegExp(q, "i") },
    ],
    status: "active",
  }).select("firstName lastName employeeCode department designation").limit(10);
  return emps;
}

// ---- Tool declarations for Gemini ----
const tools = [
  {
    functionDeclarations: [
      {
        name: "get_headcount",
        description: "Get total active headcount and breakdown by department",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get_attendance_summary",
        description: "Get attendance summary for a specific date (defaults to today)",
        parameters: {
          type: "object",
          properties: { date: { type: "string", description: "Date in YYYY-MM-DD format" } },
        },
      },
      {
        name: "get_late_comers",
        description: "Get employees who came late most often in a month",
        parameters: {
          type: "object",
          properties: { month: { type: "string", description: "Month in YYYY-MM format" } },
        },
      },
      {
        name: "get_leave_summary",
        description: "Get leave request summary",
        parameters: {
          type: "object",
          properties: { month: { type: "string", description: "Month in YYYY-MM format" } },
        },
      },
      {
        name: "get_my_leave_balance",
        description: "Get the current employee's leave balance for each leave type",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get_payroll_summary",
        description: "Get payroll summary for a month",
        parameters: {
          type: "object",
          properties: { month: { type: "string", description: "Month in YYYY-MM format" } },
        },
      },
      {
        name: "search_employees",
        description: "Search for employees by name or code (not available to employees)",
        parameters: {
          type: "object",
          properties: { q: { type: "string", description: "Search query" } },
          required: ["q"],
        },
      },
    ],
  },
];

const SYSTEM_PROMPT = `You are HCM Lite AI Assistant — an HR assistant built into the system.
You answer questions using the tools provided. Use only data from the tools.

Company Rules (Policy Q&A):
- Office start: 09:00, grace: 15 minutes, late after 09:15
- Half day: < 5 hours worked
- Leave quotas (annual): Annual=14, Sick=8, Casual=10, Unpaid=unlimited
- Tax slabs on annual gross: 0-600k=0%, 600k-1.2M=5%, 1.2M-2.4M=15%, 2.4M-3.6M=25%, >3.6M=35%
- Gross = basic × 1.5 (HRA=40% of basic, Medical=10% of basic)

STRICT RULES:
1. Never reveal another employee's salary. If asked, politely refuse.
2. Employees can only see their own data. Enforce this in your answers.
3. All answers must be labelled [AI-generated].
4. If you don't know something or can't access it, say so clearly.
5. If a tool fails, show a friendly error message.`;

async function callTool(name, args, role, employeeId) {
  switch (name) {
    case "get_headcount": return get_headcount(role, employeeId);
    case "get_attendance_summary": return get_attendance_summary(role, employeeId, args.date);
    case "get_late_comers": return get_late_comers(role, args.month);
    case "get_leave_summary": return get_leave_summary(role, employeeId, args.month);
    case "get_my_leave_balance": return get_my_leave_balance(employeeId);
    case "get_payroll_summary": return get_payroll_summary(role, args.month);
    case "search_employees": return search_employees(role, args.q);
    default: return { error: "Unknown tool" };
  }
}

export const aiChat = async (req, res, next) => {
  const start = Date.now();
  try {
    const { message } = req.body;
    if (!message) throw new ApiError(400, "Message is required");

    const user = req.auth.user;
    const role = user.role;

    if (!checkRateLimit(user.id)) {
      throw new ApiError(429, "Rate limit exceeded. Please try again later.");
    }

    // Find employee record for scope enforcement
    const emp = await Employee.findOne({ userId: user.id });
    const employeeId = emp?._id;

    // Graceful fallback if no API key
    if (!env.AI_API_KEY) {
      const fallback = `[AI-generated] Hello! I'm the HCM Lite AI Assistant. I'm currently running in fallback mode because no AI API key is configured. Please set AI_API_KEY in the server's .env file to enable full AI features.`;
      await AiLog.create({ userId: user.id, userRole: role, prompt: message, response: fallback, durationMs: Date.now() - start });
      return res.json({ reply: fallback, source: "fallback" });
    }

    const genAI = new GoogleGenerativeAI(env.AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", tools });

    const chat = model.startChat({
      systemInstruction: SYSTEM_PROMPT,
      history: [],
    });

    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000));

    const result = await Promise.race([chat.sendMessage(message), timeout]);
    let response = result.response;
    const toolsUsed = [];

    // Handle tool calls (function calling loop)
    let loopCount = 0;
    while (response.functionCalls()?.length > 0 && loopCount < 3) {
      loopCount++;
      const calls = response.functionCalls();
      const toolResults = [];

      for (const call of calls) {
        toolsUsed.push(call.name);
        const toolResult = await callTool(call.name, call.args, role, employeeId);
        toolResults.push({
          functionResponse: { name: call.name, response: { result: JSON.stringify(toolResult) } },
        });
      }

      const followUp = await chat.sendMessage(toolResults);
      response = followUp.response;
    }

    const replyText = response.text() || "I couldn't generate a response. Please try again.";
    const reply = `[AI-generated] ${replyText}`;

    await AiLog.create({ userId: user.id, userRole: role, prompt: message, toolsUsed, response: reply, durationMs: Date.now() - start });

    res.json({ reply, source: "gemini" });
  } catch (err) {
    if (err.message === "timeout") {
      const fallback = "[AI-generated] I'm taking too long to respond. Please try again in a moment.";
      return res.json({ reply: fallback, source: "timeout" });
    }
    next(err);
  }
};

export const dashboardSummary = async (req, res, next) => {
  try {
    const { kpiData } = req.body;
    if (!kpiData) throw new ApiError(400, "KPI data required");

    const user = req.auth.user;

    if (!env.AI_API_KEY) {
      return res.json({
        summary: "[AI-generated] Dashboard summary requires an AI API key to be configured.",
        source: "fallback",
      });
    }

    const genAI = new GoogleGenerativeAI(env.AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an HR analytics AI. Analyze these KPI metrics and provide 3-5 concise insight bullets about workforce performance and trends. Only use the data provided. Be specific with numbers.\n\nKPI Data:\n${JSON.stringify(kpiData, null, 2)}`;

    const result = await model.generateContent(prompt);
    const summary = `[AI-generated] ${result.response.text()}`;

    res.json({ summary, source: "gemini" });
  } catch (err) {
    next(err);
  }
};

export const smartLeave = async (req, res, next) => {
  try {
    const { sentence } = req.body;
    if (!sentence) throw new ApiError(400, "Leave description sentence required");

    const user = req.auth.user;
    const today = new Date().toISOString().slice(0, 10);

    if (!env.AI_API_KEY) {
      return res.json({
        parsed: null,
        message: "Smart leave requires an AI API key.",
        source: "fallback",
      });
    }

    const genAI = new GoogleGenerativeAI(env.AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Today is ${today}. Parse this leave request into JSON: "${sentence}"
    
Return ONLY valid JSON with these fields:
{
  "type": "annual" | "sick" | "casual" | "unpaid",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "reason": "short reason string"
}

Rules:
- "next Monday" means the upcoming Monday from today
- If no end date is specified, end = start
- Choose the most appropriate leave type based on context (sick leave for medical, casual for personal/events)
- Return ONLY the JSON object, no explanation`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.json({ parsed: null, message: "Could not parse leave request. Please fill the form manually.", source: "parse_error" });
    }

    res.json({ parsed, source: "gemini" });
  } catch (err) {
    next(err);
  }
};
