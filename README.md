# Interest Tracker v2 (Chrome + Firefox)

A local-first browser extension that estimates interest topics and suggests related things to explore. AI classification is **off by default** and uses an explicitly configured OpenAI API key only when enabled.

## Install in Chrome / Chromium
1. Extract the ZIP.
2. Open `chrome://extensions` and enable Developer mode.
3. Click **Load unpacked** and select this project folder (the one containing `manifest.json`).

## Install in Firefox (temporary developer install)
1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select `manifest.firefox.json` in the project folder. If your Firefox build requires the standard manifest filename, copy the project to a separate folder, copy `manifest.firefox.json` there as `manifest.json`, and select that file.

The project ships separate manifests because Chrome uses an MV3 service worker while Firefox compatibility can vary by release. The rest of the source files are shared.

## AI topic classification (optional)
1. Open the extension's **Privacy & settings** page.
2. Enter your own OpenAI API key and model (default `gpt-4o-mini`).
3. Check **Enable AI classification**, then save.

Only the page title and hostname are sent to the OpenAI API. Page body text, full URLs, URL query strings, clicks, form fields, and passwords are not collected or sent. Each newly recorded page may make an API request and incur charges. API keys are stored in the browser's extension storage, which is not encrypted by this extension; use a dedicated key with appropriate limits and remove it when no longer needed. AI calls require network access and a valid key. If AI classification fails, local keyword tags remain in place.

## Features
- Page title and hostname capture; full URL and query string are not stored.
- Local keyword classification by default; optional AI labels.
- Lightweight topic-based discovery suggestions that open a web search only when clicked.
- Pause/resume, excluded domains, clear-history controls, and recent activity.
- Maximum of 2,000 stored visits.

## Permissions and limitations
- `tabs`: observe the active tab's title and URL to record eligible page visits.
- `storage`: save settings and visit summaries in the local browser profile.
- `https://api.openai.com/*`: available for the opt-in AI request.

The extension ignores browser-internal and non-HTTP(S) pages. Topic labels are estimates, not a definitive user profile. Recommendations are starter prompts, not personalized ranking of specific articles. Test locally before distribution or store publication; review current browser store policies and API provider terms before release.
