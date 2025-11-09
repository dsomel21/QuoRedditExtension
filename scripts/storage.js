const SESSION_KEY = "links";

export function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return {
      url: String(entry ?? ""),
      title: "",
      capturedAt: "",
      summary: "",
      category: "",
      sentimentLabel: "",
      sentimentScore: "",
      postedAt: ""
    };
  }

  return {
    url: String(entry.url ?? ""),
    title: String(entry.title ?? ""),
    capturedAt: String(entry.capturedAt ?? ""),
    summary: String(entry.summary ?? ""),
    category: String(entry.category ?? ""),
    sentimentLabel: String(entry.sentimentLabel ?? entry.mood ?? ""),
    sentimentScore: String(entry.sentimentScore ?? entry.sentiment ?? ""),
    postedAt: String(entry.postedAt ?? entry.posted_at ?? "")
  };
}

export async function getSavedLinks() {
  try {
    const result = await chrome.storage.session.get({ [SESSION_KEY]: [] });
    const links = Array.isArray(result[SESSION_KEY]) ? result[SESSION_KEY] : [];
    return links.map(normalizeEntry);
  } catch (error) {
    console.error("Failed to load saved links:", error);
    return [];
  }
}

export async function setSavedLinks(entries) {
  try {
    const normalized = Array.isArray(entries) ? entries.map(normalizeEntry) : [];
    await chrome.storage.session.set({ [SESSION_KEY]: normalized });
  } catch (error) {
    console.error("Failed to persist saved links:", error);
    throw error;
  }
}

export async function addSavedLink(entry) {
  const links = await getSavedLinks();
  links.push(normalizeEntry(entry));
  await setSavedLinks(links);
  return links;
}

export async function clearSavedLinks() {
  await chrome.storage.session.set({ [SESSION_KEY]: [] });
  return [];
}

