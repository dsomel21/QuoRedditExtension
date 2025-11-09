const ALLOWED_REDDIT_HOSTS = ["reddit.com", "www.reddit.com", "old.reddit.com"];

export function isRedditUrl(urlString) {
  try {
    const url = new URL(urlString);
    return (
      ALLOWED_REDDIT_HOSTS.includes(url.hostname) ||
      url.hostname.endsWith(".reddit.com")
    );
  } catch {
    return false;
  }
}

export async function getRedditPostMetadata(tabId) {
  const [response] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const titleEl = document.querySelector('[slot="title"]');
      const titleText = titleEl?.innerText?.trim() ?? "";

      const timeSelectors = [
        '[slot="title"] time[datetime]',
        '[slot="timestamp"] time[datetime]',
        'time[datetime]'
      ];

      let postedAt = "";
      for (const selector of timeSelectors) {
        const timeEl = document.querySelector(selector);
        const date = timeEl?.getAttribute("datetime") || timeEl?.dateTime;
        if (date) {
          postedAt = date;
          break;
        }
      }

      const bodySelectors = [
        '[slot="text-body"]',
        '[slot="body"]',
        '[data-test-id="post-content"]',
        '[data-testid="content-gate"]',
        "article",
        "main"
      ];

      let bodyText = "";
      for (const selector of bodySelectors) {
        const el = document.querySelector(selector);
        if (el?.innerText?.trim()) {
          bodyText = el.innerText.trim();
          break;
        }
      }

      if (!bodyText) {
        bodyText = document.body?.innerText?.trim() ?? "";
      }

      const MAX_BODY_LENGTH = 4000;
      const truncatedBody = bodyText.slice(0, MAX_BODY_LENGTH);

      return {
        hasTitle: Boolean(titleEl),
        title: titleText,
        body: truncatedBody,
        postedAt
      };
    }
  });

  return response?.result ?? { hasTitle: false, title: "", body: "", postedAt: "" };
}

