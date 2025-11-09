import { getSavedLinks, clearSavedLinks } from "./storage.js";
import { linksToCsv } from "./csv.js";

const bodyEl = document.getElementById("links-body");
const countEl = document.getElementById("link-count");
const copyBtn = document.getElementById("copy-csv");
const downloadBtn = document.getElementById("download-csv");
const refreshBtn = document.getElementById("refresh");
const clearBtn = document.getElementById("clear-all");
const toastEl = document.getElementById("toast");

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("links__toast--visible");
  setTimeout(() => {
    toastEl.classList.remove("links__toast--visible");
  }, 2200);
}

function formatDate(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function renderLinks(links) {
  bodyEl.innerHTML = "";

  if (!links.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.className = "links__empty";
    emptyRow.innerHTML = `<td colspan="8">No links yet. Capture one from the popup.</td>`;
    bodyEl.appendChild(emptyRow);
    countEl.textContent = "0 links saved";
    return;
  }

  links.forEach((entry, index) => {
    const row = document.createElement("tr");

    const indexCell = document.createElement("td");
    indexCell.textContent = String(index + 1).padStart(2, "0");

    const titleCell = document.createElement("td");
    titleCell.textContent = entry.title || "Untitled post";

    const summaryCell = document.createElement("td");
    summaryCell.textContent = entry.summary || "—";

    const categoryCell = document.createElement("td");
    categoryCell.textContent = entry.category || "—";

    const sentimentCell = document.createElement("td");
    sentimentCell.textContent = formatSentiment(entry.sentimentLabel, entry.sentimentScore);

    const postedCell = document.createElement("td");
    postedCell.textContent = formatPosted(entry.postedAt);

    const urlCell = document.createElement("td");
    urlCell.textContent = entry.url || "Missing URL";
    urlCell.classList.add("links__url");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(entry.capturedAt);

    row.appendChild(indexCell);
    row.appendChild(titleCell);
    row.appendChild(summaryCell);
    row.appendChild(categoryCell);
    row.appendChild(sentimentCell);
    row.appendChild(postedCell);
    row.appendChild(urlCell);
    row.appendChild(dateCell);
    bodyEl.appendChild(row);
  });

  const label = links.length === 1 ? "link saved" : "links saved";
  countEl.textContent = `${links.length} ${label}`;
}

function formatSentiment(label, score) {
  const trimmedLabel = String(label ?? "").trim();
  const trimmedScore = String(score ?? "").trim();

  if (!trimmedLabel && !trimmedScore) {
    return "—";
  }

  if (trimmedLabel && trimmedScore) {
    return `${trimmedLabel} (${trimmedScore}/100)`;
  }

  return trimmedLabel || `${trimmedScore}/100`;
}

function formatPosted(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let relativeLabel;
  if (diffDays <= 0) {
    relativeLabel = "today";
  } else if (diffDays === 1) {
    relativeLabel = "1 day ago";
  } else {
    relativeLabel = `${diffDays} days ago`;
  }

  return `${date.toLocaleDateString()} (${relativeLabel})`;
}

async function copyCsv() {
  const links = await getSavedLinks();
  if (!links.length) {
    showToast("No links to copy yet.");
    return;
  }

  const csv = linksToCsv(links);
  try {
    await navigator.clipboard.writeText(csv);
    showToast("Copied CSV to clipboard.");
  } catch (error) {
    console.error("Failed to copy CSV:", error);
    showToast("Copy failed. Check clipboard permissions.");
  }
}

async function downloadCsv() {
  const links = await getSavedLinks();
  if (!links.length) {
    showToast("No links to download yet.");
    return;
  }

  const csv = linksToCsv(links);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `quo-support-links-${timestamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
  showToast("CSV downloaded.");
}

async function refreshLinks() {
  const links = await getSavedLinks();
  renderLinks(links);
  showToast("List refreshed.");
}

copyBtn?.addEventListener("click", copyCsv);
downloadBtn?.addEventListener("click", downloadCsv);
refreshBtn?.addEventListener("click", refreshLinks);
clearBtn?.addEventListener("click", async () => {
  await clearSavedLinks();
  renderLinks([]);
  showToast("Cleared all saved links.");
  countEl.textContent = "0 links saved";
});

(async () => {
  const links = await getSavedLinks();
  renderLinks(links);
})();

