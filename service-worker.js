chrome.runtime.onInstalled.addListener(async () => {
  try {
    const existing = await chrome.storage.session.get({ links: [] });
    if (!Array.isArray(existing.links)) {
      await chrome.storage.session.set({ links: [] });
    }
  } catch (error) {
    console.error("Failed to initialize session storage:", error);
  }
});


