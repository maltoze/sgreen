# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Develop

```bash
pnpm build                  # Production build
pnpm watch                  # Dev build with watch (no minify)
pnpm lint                   # Biome check (lint + format)
pnpm format                 # Biome format --write
pnpm tsc                    # TypeScript type-check (noEmit)
pnpm storybook              # Run Storybook on port 6006 (DISABLE_WEBEXTENSION=1)
```

The package manager is **pnpm v10**. CI (`.github/workflows/lint.yaml`) runs `pnpm tsc` then `pnpm lint`. A Husky pre-push hook runs the same checks.

## Architecture

Sgreen is a **Chrome extension (Manifest V3)** that records the user's screen. It uses `@samrum/vite-plugin-web-extension` to build multiple entry points from `src/entries/`.

### Entry points

| Entry | Path | Purpose |
|-------|------|---------|
| **background** | `src/entries/background/main.ts` | Service worker. Orchestrates everything: reacts to extension icon click, injects content script, creates offscreen document, routes messages between entries. |
| **contentScript** | `src/entries/contentScript/primary/main.tsx` | Injected into pages. Renders the Controlbar, Countdown, StrokeKeysDisplay, MouseClick, and SelectingArea components inside a Shadow DOM. |
| **offscreen** | `src/entries/background/offscreen.ts` | Offscreen document that runs `MediaRecorder`. Necessary because service workers cannot access `getUserMedia`. |
| **tabs** | `src/entries/tabs/main.tsx` | Serves dual purpose: (1) triggers `desktopCapture.chooseDesktopMedia` for desktop mode, (2) displays the recorded video with confetti after recording completes. |
| **options** | `src/entries/options/` | Placeholder options page. |

### Recording flow

1. User clicks extension icon → background service worker (`background/main.ts`) injects content script into the active tab (if not already there) and sends `show-controlbar` message.
2. Content script renders `Controlbar` as a draggable floating bar. User picks recording mode (area/tab/desktop) and options (audio, keystrokes, mouse clicks, countdown, scrollbar).
3. On "Start":
   - **tab/area modes**: Content script sends `start-recording` → background → background creates offscreen document → offscreen's `Recorder` class (`lib/recording.ts`) captures tab media via `chrome.tabCapture.getMediaStreamId` + `getUserMedia`.
   - **desktop mode**: Background opens `tabs/main.html?tabId=X` → that page calls `chrome.desktopCapture.chooseDesktopMedia` and records directly via its own `Recorder` instance.
4. On stop: `recording-complete` message back to background → background opens `tabs/main.html?videoUrl=...` to show the result.

Area recording works by drawing the source video onto a canvas cropped to the selected area, then capturing the canvas stream.

### State management

Zustand store in `src/entries/store.ts`, persisted to `chrome.storage.local` via Zustand's `persist` middleware. Holds recording preferences (mode, audio, keystrokes, mouse clicks, countdown, scrollbar, area bounds) and UI state (`isRecording`, `showControlbar`, `showCountdown`). Accessed by both content script and background script.

### Shadow DOM rendering

Content script styles are isolated via Shadow DOM. `renderContent.ts` creates the shadow root and injects CSS. Non-production builds use HMR; production builds load CSS files via `webextension-polyfill` URLs.

### UI

- shadcn/ui (New York style) with Tailwind CSS + CSS variables for theming
- Components live in `src/components/ui/` (button, dropdown-menu, label, radio-group, switch, tooltip)
- `src/lib/utils.ts` exports the `cn()` helper (Tailwind class merge via `clsx` + `tailwind-merge`)
- Storybook configured, stories live alongside components (`*.stories.tsx`)
- `components.json` defines shadcn config

### Paths & Aliases

`~` maps to `src/`. Imports use `~/lib/utils`, `~/components/ui/button`, `~/entries/store`, etc.

### Key dependencies

- `@samrum/vite-plugin-web-extension` — extension build tooling (manifest generation, HMR for content scripts, cross-entry chunking)
- `fix-webm-duration` — patches WebM duration metadata after recording
- `webextension-polyfill` — cross-browser extension API polyfill (used in rendering, not in background)
- `framer-motion` — animations for Controlbar show/hide transitions
- `react-draggable` — makes the Controlbar draggable
- Sentry — error tracking in production (background, content script, tabs page)
