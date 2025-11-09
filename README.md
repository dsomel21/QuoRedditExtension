# Quo Support Insights

A Chrome extension that helps you collect Reddit posts or comments for support insights during your browser session.

## Features

- **Add Current Page**: Quickly capture Reddit posts or comments you're viewing
- **View Links**: See all collected links in one place
- **Session Storage**: Links are stored for the current browser session
- **Reddit Support**: Works with both new and old Reddit interfaces

## Installation

1. Clone this repository:
   ```bash
   git clone git@github.com:dsomel21/QuoRedditExtension.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in the top right)

4. Click "Load unpacked" and select the `QuoRedditExtension` directory

5. The extension icon should now appear in your Chrome toolbar

## Usage

1. Navigate to any Reddit post or comment page
2. Click the extension icon in your toolbar
3. Click "Add Current Page" to save the link
4. Click "View Links" to see all collected links for your session

### Enable AI summaries

To unlock automatic summaries, categories, and sentiment scores, set your OpenAI API key by running this in any extension page console:

```js
await chrome.storage.local.set({ openAiKey: 'sk-your-key' });
```

You can also paste the key into the extension’s Options page.

## Requirements

- Chrome browser (or Chromium-based browser)
- Active Reddit page (new or old Reddit)

## Permissions

This extension requires:
- `tabs` - To access the current tab's URL
- `storage` - To save collected links
- `scripting` - To extract post titles from Reddit pages
- Reddit domain access - To work on Reddit pages

## Development

This is a Manifest V3 Chrome extension built with vanilla JavaScript.

## License

MIT
