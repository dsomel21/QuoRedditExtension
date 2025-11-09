const statusEl = document.getElementById("status");
const addButton = document.getElementById("add-current");
const viewButton = document.getElementById("view-links");

function setStatus(message, tone = "neutral") {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
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
    return [];
  }
}

async function saveLinks(updatedLinks) {
  try {
    await chrome.storage.session.set({ links: updatedLinks });
  } catch (error) {
    console.error("Failed to save session links:", error);
    throw error;
  }
}

async function addCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || typeof tab.id !== "number") {
      setStatus("Unable to capture this tab's URL.", "error");
      return;
    }

    const urlObject = new URL(tab.url);
    // Accept only Reddit domains for this MVP to stay focused on support insights
    const allowedHosts = ["reddit.com", "www.reddit.com", "old.reddit.com"];
    if (!allowedHosts.includes(urlObject.hostname) && !urlObject.hostname.endsWith(".reddit.com")) {
      setStatus("This page is not on Reddit.", "warning");
      return;
    }

    let postMeta = null;
    try {
      const [response] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const titleEl = document.querySelector('[slot="title"]');
          const titleText = titleEl?.innerText?.trim() ?? "";
          return {
            exists: Boolean(titleEl),
            title: titleText
          };
        }
      });
      postMeta = response?.result ?? { exists: false, title: "" };
    } catch (scriptError) {
      console.error("Failed to verify Reddit post title:", scriptError);
      setStatus("Couldn't verify the Reddit post. Try reloading.", "error");
      return;
    }

    if (!postMeta.exists) {
      setStatus("Can't find a Reddit post title here.", "warning");
      return;
    }

    const links = await getLinks();
    if (links.some((entry) => entry.url === tab.url)) {
      setStatus("Already added to your list.", "info");
      return;
    }

    links.push({
      url: tab.url,
      title: postMeta.title || urlObject.pathname,
      capturedAt: new Date().toISOString()
    });
    await saveLinks(links);
    setStatus("Saved! View all links to export.", "success");
  } catch (error) {
    console.error("Failed to add current page:", error);
    setStatus("Something went wrong. Try again.", "error");
  }
}

function openLinksPage() {
  const url = chrome.runtime.getURL("links.html");
  chrome.tabs.create({ url });
}

addButton?.addEventListener("click", addCurrentPage);
viewButton?.addEventListener("click", openLinksPage);

setStatus("Ready to collect insights.");


