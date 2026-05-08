import { offscreenUrl } from '~/constants'
import {
  getCurrentTab,
  getStreamId,
  hasOffscreenDocument,
  isScriptableUrl,
  sendMessage,
  sendTabMessage,
} from '~/lib/utils'
import { RecordingMode, RecordingOptions } from '~/types'
import { useStore } from '../store'

let captureException: (err: unknown) => void = () => {}

if (import.meta.env.MODE === 'production') {
  void import('@sentry/browser')
    .then((Sentry) => {
      captureException = Sentry.captureException
      Sentry.init({
        dsn: 'https://d12dd277a192c6ca69ba59ebb958e6e2@o82598.ingest.sentry.io/4505787043479552',
      })
    })
    .catch((error) => {
      console.error('Failed to initialize Sentry in background.', error)
    })
}

let isRecording = false
let recordingMode: RecordingMode | null
let recordingTabId: number | null = null
let resultTabId: number | null = null
let stopRecordingFallbackTimer: ReturnType<typeof setTimeout> | null = null
const enabledTabs = new Set<number>()
const stopRecordingFallbackDelay = 3000

const SCRIPT_ACCESS_ERROR_MESSAGES = [
  'Cannot access a chrome-extension:// URL of different extension',
  'Cannot access contents of url',
  'The extensions gallery cannot be scripted',
]

function isScriptAccessError(err: unknown) {
  return (
    err instanceof Error &&
    SCRIPT_ACCESS_ERROR_MESSAGES.some((message) =>
      err.message?.includes(message),
    )
  )
}

async function updateActionState(tabId: number, url?: string) {
  if (isRecording) {
    await chrome.action.enable(tabId)
    return
  }

  if (isScriptableUrl(url)) {
    await chrome.action.enable(tabId)
  } else {
    enabledTabs.delete(tabId)
    await chrome.action.disable(tabId)
  }
}

async function updateCurrentActionState() {
  const tab = await getCurrentTab()
  if (!tab.id) return
  await updateActionState(tab.id, tab.pendingUrl ?? tab.url)
}

async function executeContentScript(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['/src/entries/contentScript/primary/main.js'],
    })
    return true
  } catch (err) {
    if (isScriptAccessError(err)) {
      enabledTabs.delete(tabId)
      await chrome.action.disable(tabId)
      return false
    }
    throw err
  }
}

function resetRecordingState() {
  if (stopRecordingFallbackTimer) {
    clearTimeout(stopRecordingFallbackTimer)
    stopRecordingFallbackTimer = null
  }
  if (recordingTabId) {
    sendTabMessage(recordingTabId, { type: 'stop-recording' }).catch(() => {})
  }
  chrome.action.setBadgeText({ text: '' })
  useStore.setState({ isRecording: false })
  isRecording = false
  recordingTabId = null
  recordingMode = null
  if (resultTabId) {
    chrome.tabs.remove(resultTabId).catch(() => {})
    resultTabId = null
  }
  chrome.offscreen.closeDocument().catch(() => {})
  updateCurrentActionState().catch(() => {})
}

function stopRecording() {
  sendMessage({
    type: 'stop-recording',
    target: 'offscreen',
  })
  recordingTabId &&
    sendTabMessage(recordingTabId, { type: 'stop-recording' }).catch(() => {})
  if (recordingMode === 'desktop') {
    resultTabId &&
      sendTabMessage(resultTabId, { type: 'stop-recording' }).catch(() => {})
  }
}

function stopRecordingWithFallback() {
  stopRecording()

  if (stopRecordingFallbackTimer) {
    clearTimeout(stopRecordingFallbackTimer)
  }
  stopRecordingFallbackTimer = setTimeout(() => {
    resetRecordingState()
  }, stopRecordingFallbackDelay)
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs
    .get(tabId)
    .then((tab) => updateActionState(tabId, tab.pendingUrl ?? tab.url))
    .catch(() => {})
})

updateCurrentActionState().catch(() => {})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' || changeInfo.url) {
    updateActionState(tabId, tab.pendingUrl ?? tab.url).catch(() => {})
  }

  if (
    changeInfo.status === 'loading' &&
    enabledTabs.has(tabId) &&
    isScriptableUrl(tab.pendingUrl ?? tab.url)
  ) {
    void executeContentScript(tabId).catch((err) => captureException(err))
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  if (enabledTabs.has(tabId)) {
    enabledTabs.delete(tabId)
  }
  if (tabId === resultTabId) {
    resultTabId = null
    if (isRecording) {
      resetRecordingState()
    }
  }
  if (tabId === recordingTabId && isRecording) {
    recordingTabId = null
    stopRecordingWithFallback()
  }
})

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return

  if (isRecording) {
    stopRecordingWithFallback()
  } else {
    if (!isScriptableUrl(tab.url)) {
      enabledTabs.delete(tab.id)
      await chrome.action.disable(tab.id)
      return
    }
    if (enabledTabs.has(tab.id)) {
      sendTabMessage(tab.id, { type: 'show-controlbar' })
    } else {
      const injected = await executeContentScript(tab.id)
      if (!injected) return

      const delivered = await sendTabMessage(tab.id, {
        type: 'show-controlbar',
      })
      if (delivered) {
        enabledTabs.add(tab.id)
      }
    }
  }
})

async function startRecording(data: Partial<RecordingOptions>) {
  const hasOffscreen = await hasOffscreenDocument()
  if (!hasOffscreen) {
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      justification: 'Recording from chrome.tabCapture API',
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
    })
  }

  recordingMode = data.recordingMode ?? null
  const tab = await getCurrentTab()
  if (!tab.id) return

  if (recordingMode && ['tab', 'area'].includes(recordingMode)) {
    const streamId = await getStreamId(tab.id)
    sendMessage({
      type: 'start-recording',
      target: 'offscreen',
      data: { streamId, width: tab.width, height: tab.height, ...data },
    })
    recordingTabId = tab.id
  } else {
    const recordingTab = await chrome.tabs.create({
      url: `/src/entries/tabs/main.html?tabId=${tab.id}`,
    })
    resultTabId = recordingTab.id ?? null
  }
  chrome.action.setBadgeText({ text: 'REC' })
  chrome.action.setBadgeTextColor({ color: '#ffffff' })
  chrome.action.setBadgeBackgroundColor({ color: '#dc2626' })
  isRecording = true
  chrome.action.enable().catch(() => {})
}

chrome.runtime.onMessage.addListener(
  async (message, _sender, _sendResponse) => {
    if (message.target !== 'background') {
      return
    }
    switch (message.type) {
      case 'recording-complete':
        if (stopRecordingFallbackTimer) {
          clearTimeout(stopRecordingFallbackTimer)
          stopRecordingFallbackTimer = null
        }
        if (recordingMode === 'desktop') {
          if (resultTabId) {
            await chrome.tabs.update(resultTabId, { active: true })
          }
        } else {
          await chrome.tabs.create({
            url: `/src/entries/tabs/main.html?videoUrl=${encodeURIComponent(
              message.videoUrl,
            )}`,
          })
        }
        chrome.action.setBadgeText({ text: '' })
        useStore.setState({ isRecording: false })
        isRecording = false
        recordingTabId = null
        recordingMode = null
        resultTabId = null
        updateCurrentActionState().catch(() => {})
        break
      case 'recording-cancelled':
        resetRecordingState()
        break
      case 'start-recording':
        startRecording(message.data)
        break
      default:
        throw new Error('Unrecognized message:', message.type)
    }
  },
)
