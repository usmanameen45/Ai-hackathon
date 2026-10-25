import { Holiday } from "../models/Holiday.js";
import { Organization } from "../models/Organization.js";

/**
 * Get the organization settings (cached for the request if you pass the same object).
 */
export async function getOrgSettings() {
  const org = await Organization.findOne();
  return org;
}

/**
 * Get all holiday dates as Set<string> for a given year.
 */
export async function getHolidaySet(year) {
  const holidays = await Holiday.find({ year });
  return new Set(holidays.map((h) => h.date));
}

/**
 * Check if a given date string (YYYY-MM-DD) is a weekend based on org settings.
 */
export function isWeekend(dateStr, weekendDays = [0, 6]) {
  const d = new Date(dateStr + "T00:00:00Z");
  return weekendDays.includes(d.getUTCDay());
}

/**
 * Count working days between two ISO date strings (inclusive), excluding weekends and holidays.
 */
export async function countWorkingDays(startDate, endDate, weekendDays = [0, 6]) {
  const year = parseInt(startDate.slice(0, 4));
  const holidaySet = await getHolidaySet(year);

  let count = 0;
  const current = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    if (!isWeekend(dateStr, weekendDays) && !holidaySet.has(dateStr)) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

/**
 * Compute tax deduction (annual slab applied to gross*12, returned as monthly).
 */
export function computeMonthlyTax(grossMonthly) {
  const annual = grossMonthly * 12;
  let annualTax = 0;

  if (annual <= 600_000) {
    annualTax = 0;
  } else if (annual <= 1_200_000) {
    annualTax = (annual - 600_000) * 0.05;
  } else if (annual <= 2_400_000) {
    annualTax = 30_000 + (annual - 1_200_000) * 0.15;
  } else if (annual <= 3_600_000) {
    annualTax = 210_000 + (annual - 2_400_000) * 0.25;
  } else {
    annualTax = 510_000 + (annual - 3_600_000) * 0.35;
  }

  return annualTax / 12;
}

/**
 * Compute gross from basic.
 * Gross = 1.5 × basic (HRA 40%, Medical 10%)
 */
export function computeGross(basic) {
  const hra = basic * 0.4;
  const medical = basic * 0.1;
  const gross = basic + hra + medical;
  return { basic, hra, medical, gross };
}
