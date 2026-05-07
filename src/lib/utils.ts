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
