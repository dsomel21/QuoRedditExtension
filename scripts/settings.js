const OPEN_AI_KEY_STORAGE_KEY = "openAiKey";

export async function getOpenAiKey() {
  try {
    const result = await chrome.storage.local.get({ [OPEN_AI_KEY_STORAGE_KEY]: "" });
    return String(result[OPEN_AI_KEY_STORAGE_KEY] ?? "").trim();
  } catch (error) {
    console.error("Failed to read OpenAI API key:", error);
    return "";
  }
}

export async function setOpenAiKey(value) {
  try {
    await chrome.storage.local.set({
      [OPEN_AI_KEY_STORAGE_KEY]: String(value ?? "").trim()
    });
  } catch (error) {
    console.error("Failed to store OpenAI API key:", error);
    throw error;
  }
}

export async function clearOpenAiKey() {
  try {
    await chrome.storage.local.remove(OPEN_AI_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear OpenAI API key:", error);
    throw error;
  }
}

