import { getOpenAiKey } from "./settings.js";

export class MissingOpenAiKeyError extends Error {
  constructor() {
    super("OpenAI API key is not configured.");
    this.name = "MissingOpenAiKeyError";
  }
}

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export async function summarizeSupportSignal({ title, url, body }) {
  const apiKey = await getOpenAiKey();
  if (!apiKey) {
    throw new MissingOpenAiKeyError();
  }

  const payload = {
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You analyze Reddit support feedback for the Quo product team. Respond ONLY with JSON containing keys summary, category, sentiment_label, and sentiment_score. The summary must be 155 characters or less. sentiment_score should be an integer from 0 (very upset) to 100 (very happy). Choose clear, specific categories."
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            title,
            url,
            body
          },
          null,
          2
        )
      }
    ]
  };

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", errorText);
    throw new Error("OpenAI request failed.");
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  const cleaned = stripJsonCodeFences(content).trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse OpenAI response:", cleaned, error);
    throw new Error("Unexpected response format from OpenAI.");
  }

  return {
    summary: truncate(String(parsed.summary ?? ""), 155),
    category: String(parsed.category ?? ""),
    sentimentLabel: String(parsed.sentiment_label ?? parsed.sentimentLabel ?? ""),
    sentimentScore: formatSentimentScore(parsed.sentiment_score ?? parsed.sentimentScore)
  };
}

function stripJsonCodeFences(content) {
  const text = String(content ?? "");
  if (!text.startsWith("```")) {
    return text;
  }

  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "");
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function formatSentimentScore(score) {
  const numeric = Number(score);
  if (Number.isFinite(numeric)) {
    const clamped = Math.max(0, Math.min(100, Math.round(numeric)));
    return String(clamped);
  }
  return "";
}

