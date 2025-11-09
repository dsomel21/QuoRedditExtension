import { normalizeEntry } from "./storage.js";

const CSV_HEADERS = [
  "title",
  "summary",
  "category",
  "sentimentLabel",
  "sentimentScore",
  "url",
  "postedAt",
  "capturedAt"
];

export function linksToCsv(entries) {
  const rows = Array.isArray(entries) ? entries.map(normalizeEntry) : [];
  if (!rows.length) {
    return "";
  }

  const headerRow = CSV_HEADERS.map(escapeCsvValue).join(",");
  const dataRows = rows.map((entry) =>
    CSV_HEADERS.map((key) => escapeCsvValue(entry?.[key] ?? "")).join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

