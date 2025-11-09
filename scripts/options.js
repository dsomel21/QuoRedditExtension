import { getOpenAiKey, setOpenAiKey, clearOpenAiKey } from "./settings.js";

const form = document.getElementById("api-key-form");
const input = document.getElementById("api-key");
const clearButton = document.getElementById("clear-key");
const statusEl = document.getElementById("status");

function setStatus(message, tone = "neutral") {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

async function hydrate() {
  const existingKey = await getOpenAiKey();
  input.value = existingKey;
  setStatus(existingKey ? "API key loaded securely." : "No API key saved yet.", "info");
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = input.value.trim();

  if (!value) {
    setStatus("Enter a valid OpenAI API key.", "warning");
    return;
  }

  try {
    await setOpenAiKey(value);
    setStatus("API key saved. You can now summarize posts.", "success");
    input.value = value;
  } catch (error) {
    console.error("Failed to save API key:", error);
    setStatus("Couldn't save the API key. Try again.", "error");
  }
});

clearButton?.addEventListener("click", async () => {
  try {
    await clearOpenAiKey();
    input.value = "";
    setStatus("API key cleared.", "info");
  } catch (error) {
    console.error("Failed to clear API key:", error);
    setStatus("Couldn't clear the API key. Try again.", "error");
  }
});

hydrate();

