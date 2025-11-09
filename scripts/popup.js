import { getSavedLinks, setSavedLinks } from "./storage.js";
import { isRedditUrl, getRedditPostMetadata } from "./reddit.js";
import { summarizeSupportSignal, MissingOpenAiKeyError } from "./openai.js";

const statusEl = document.getElementById("status");
const addButton = document.getElementById("add-current");
const viewButton = document.getElementById("view-links");

function setStatus(message, tone = "neutral") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

function setBusy(isBusy) {
  if (addButton) {
    addButton.disabled = isBusy;
    addButton.setAttribute("aria-busy", String(isBusy));
  }
}

async function addCurrentPage() {
  setBusy(true);
  try {
    setStatus("Checking this page…", "info");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || typeof tab.id !== "number") {
      setStatus("Unable to capture this tab's URL.", "error");
      return;
    }

    if (!isRedditUrl(tab.url)) {
      setStatus("This page is not on Reddit.", "warning");
      return;
    }

    const metadata = await getRedditPostMetadata(tab.id);
    if (!metadata.hasTitle) {
      setStatus("Can't find a Reddit post title here.", "warning");
      return;
    }

    const existingLinks = await getSavedLinks();
    if (existingLinks.some((entry) => entry.url === tab.url)) {
      setStatus("Already added to your list.", "info");
      return;
    }

    setStatus("Analyzing support signal…", "info");

    let statusMessage = "Saved! Summary ready to review.";
    let statusTone = "success";
    let insights = {
      summary: "",
      category: "",
      sentimentLabel: "",
      sentimentScore: ""
    };

    try {
      insights = await summarizeSupportSignal({
        title: metadata.title,
        url: tab.url,
        body: metadata.body
      });
    } catch (error) {
      if (error instanceof MissingOpenAiKeyError) {
        statusMessage = "Saved. Add your OpenAI key in Options for summaries.";
        statusTone = "warning";
      } else {
        console.error("Failed to summarize support signal:", error);
        statusMessage = "Saved without a summary. Try again later.";
        statusTone = "warning";
      }
    }

    const newEntry = {
      url: tab.url,
      title: metadata.title || new URL(tab.url).pathname,
      capturedAt: new Date().toISOString(),
      postedAt: metadata.postedAt || "",
      summary: insights.summary ?? "",
      category: insights.category ?? "",
      sentimentLabel: insights.sentimentLabel ?? "",
      sentimentScore: insights.sentimentScore ?? ""
    };

    await setSavedLinks([...existingLinks, newEntry]);
    setStatus(statusMessage, statusTone);
  } catch (error) {
    console.error("Failed to add current page:", error);
    setStatus("Something went wrong. Try again.", "error");
  } finally {
    setBusy(false);
  }
}

function openLinksPage() {
  const url = chrome.runtime.getURL("links.html");
  chrome.tabs.create({ url });
}

addButton?.addEventListener("click", addCurrentPage);
viewButton?.addEventListener("click", openLinksPage);

setBusy(false);
setStatus("Ready to collect insights.");

