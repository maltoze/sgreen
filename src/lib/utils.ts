import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { offscreenUrl } from '~/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// See: https://developer.chrome.com/docs/extensions/reference/offscreen/#before-chrome-116-check-if-an-offscreen-document-is-open
export async function hasOffscreenDocument() {
  // @ts-ignore
  if (chrome.runtime.getContexts) {
    // @ts-ignore
    const existingContexts = await chrome.runtime.getContexts({})
    const offscreenDocument = existingContexts.find(
      // @ts-ignore
      (c) => c.contextType === 'OFFSCREEN_DOCUMENT',
    )
    return !!offscreenDocument
  } else {
    const matchedClients = await clients.matchAll()
    for (const client of matchedClients) {
      if (client.url === offscreenUrl) {
        return true
      }
    }
    return false
  }
}

export async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  return tab
}

export function getStreamId(tabId: number) {
  return new Promise<string>((resolve) => {
    chrome.tabCapture.getMediaStreamId(
      {
        targetTabId: tabId,
      },
      (streamId) => {
        resolve(streamId)
      },
    )
  })
}

export function isScriptableUrl(url?: string) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    if (
      parsed.protocol !== 'http:' &&
      parsed.protocol !== 'https:' &&
      parsed.protocol !== 'file:'
    )
      return false
    if (parsed.hostname === 'chromewebstore.google.com') return false
    return true
  } catch {
    return false
  }
}

const RECEIVING_END_ERROR = 'Receiving end does not exist'

function ignoreReceivingEndError(err: Error) {
  if (err.message?.includes(RECEIVING_END_ERROR)) {
    return
  }
  throw err
}

export function sendMessage(message: unknown) {
  return chrome.runtime.sendMessage(message).catch(ignoreReceivingEndError)
}

export async function sendTabMessage(
  tabId: number,
  message: unknown,
): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, message)
    return true
  } catch (err) {
    if (err instanceof Error && err.message?.includes(RECEIVING_END_ERROR)) {
      return false
    }
    throw err
  }
}

export function isWindows() {
  return navigator.userAgent.includes('Windows')
}

export function isMac() {
  return navigator.userAgent.includes('Macintosh')
}

const macModifiers: Record<string, string> = {
  MetaLeft: '⌘',
  MetaRight: '⌘',
  AltLeft: '⌥',
  AltRight: '⌥',
  ControlLeft: '⌃',
  ControlRight: '⌃',
  ShiftLeft: '⇧',
  ShiftRight: '⇧',
}

const windowsModifiers: Record<string, string> = {
  MetaLeft: '⊞',
  MetaRight: '⊞',
  AltLeft: 'Alt',
  AltRight: 'Alt',
  ControlLeft: 'Ctrl',
  ControlRight: 'Ctrl',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
}

export function getModifierKeyLabel(code: string): string | null {
  if (isMac()) return macModifiers[code] ?? null
  if (isWindows()) return windowsModifiers[code] ?? null
  return null
}

/** Modifier key priority for ordering (lower = displayed first) */
const modifierPriority: Record<string, number> = {
  MetaLeft: 0,
  MetaRight: 0,
  ControlLeft: 1,
  ControlRight: 1,
  AltLeft: 2,
  AltRight: 2,
  ShiftLeft: 3,
  ShiftRight: 3,
}

export function sortKeysForDisplay(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    const pa = modifierPriority[a] ?? 999
    const pb = modifierPriority[b] ?? 999
    return pa - pb || a.localeCompare(b)
  })
}
