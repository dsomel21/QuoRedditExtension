const bodyEl = document.getElementById("links-body");
const countEl = document.getElementById("link-count");
const copyBtn = document.getElementById("copy-csv");
const downloadBtn = document.getElementById("download-csv");
const refreshBtn = document.getElementById("refresh");
const toastEl = document.getElementById("toast");

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("links__toast--visible");
  setTimeout(() => {
    toastEl.classList.remove("links__toast--visible");
  }, 2200);
}

function normalizeLinks(rawLinks) {
  if (!Array.isArray(rawLinks)) return [];
  return rawLinks.map((entry) => {
    if (entry && typeof entry === "object") {
      return {
        url: String(entry.url ?? ""),
        title: String(entry.title ?? ""),
        capturedAt: String(entry.capturedAt ?? "")
      };
    }
    return { url: String(entry ?? ""), title: "", capturedAt: "" };
  });
}

async function getLinks() {
  try {
    const result = await chrome.storage.session.get({ links: [] });
    return normalizeLinks(result.links);
  } catch (error) {
    console.error("Failed to read session links:", error);
    showToast("Couldn't load links. Try refreshing.");
    return [];
  }
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
    emptyRow.innerHTML = `<td colspan="4">No links yet. Capture one from the popup.</td>`;
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

    const urlCell = document.createElement("td");
    urlCell.textContent = entry.url || "Missing URL";
    urlCell.classList.add("links__url");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(entry.capturedAt);

    row.appendChild(indexCell);
    row.appendChild(titleCell);
    row.appendChild(urlCell);
    row.appendChild(dateCell);
    bodyEl.appendChild(row);
  });

  const label = links.length === 1 ? "link saved" : "links saved";
  countEl.textContent = `${links.length} ${label}`;
}

function toCsv(links) {
  if (!links.length) {
    return "";
  }
  const header = ['"title"', '"url"', '"capturedAt"'].join(",");
  const rows = links.map((entry) => {
    const safe = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    return [safe(entry.title), safe(entry.url), safe(entry.capturedAt)].join(",");
  });
  return [header, ...rows].join("\n");
}

async function copyCsv() {
  const links = await getLinks();
  if (!links.length) {
    showToast("No links to copy yet.");
    return;
  }

  const csv = toCsv(links);
  try {
    await navigator.clipboard.writeText(csv);
    showToast("Copied CSV to clipboard.");
  } catch (error) {
    console.error("Failed to copy CSV:", error);
    showToast("Copy failed. Check clipboard permissions.");
  }
}

async function downloadCsv() {
  const links = await getLinks();
  if (!links.length) {
    showToast("No links to download yet.");
    return;
  }

  const csv = toCsv(links);
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
  const links = await getLinks();
  renderLinks(links);
  showToast("List refreshed.");
}

copyBtn?.addEventListener("click", copyCsv);
downloadBtn?.addEventListener("click", downloadCsv);
refreshBtn?.addEventListener("click", refreshLinks);

(async () => {
  const links = await getLinks();
  renderLinks(links);
})();


