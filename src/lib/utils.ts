import { clsx, type ClassValue } from 'clsx'
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

export function isWindows() {
  return navigator.userAgent.includes('Windows')
}

export function isMac() {
  return navigator.userAgent.includes('Macintosh')
}
