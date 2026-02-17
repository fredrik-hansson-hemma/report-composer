import { Report } from "./types";

const STORAGE_KEY = "rapporter_v1";

export function getAllReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getReport(id: string): Report | null {
  const reports = getAllReports();
  return reports.find((r) => r.id === id) ?? null;
}

export function saveReport(report: Report): void {
  const reports = getAllReports();
  const index = reports.findIndex((r) => r.id === report.id);
  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function deleteReport(id: string): void {
  const reports = getAllReports().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}
