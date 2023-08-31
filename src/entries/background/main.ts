import * as Sentry from '@sentry/browser'
import { offscreenUrl } from '~/constants'
import { getCurrentTab, getStreamId, hasOffscreenDocument } from '~/lib/utils'
import { RecordingMode, RecordingOptions } from '~/types'
import { useStore } from '../store'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://d12dd277a192c6ca69ba59ebb958e6e2@o82598.ingest.sentry.io/4505787043479552',
  })
}

let isRecording = false
let recordingMode: RecordingMode | null
let recordingTabId: number | null = null
let resultTabId: number | null = null
const enabledTabs = new Set()

function stopRecording() {
  chrome.runtime.sendMessage({
    type: 'stop-recording',
    target: 'offscreen',
  })
  recordingTabId &&
    chrome.tabs.sendMessage(recordingTabId, { type: 'stop-recording' })
  if (recordingMode === 'desktop') {
    resultTabId &&
      chrome.tabs.sendMessage(resultTabId, { type: 'stop-recording' })
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (changeInfo.status === 'loading' && enabledTabs.has(tabId)) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['/src/entries/contentScript/primary/main.js'],
    })
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  if (enabledTabs.has(tabId)) {
    enabledTabs.delete(tabId)
  }
})

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return

  if (isRecording) {
    stopRecording()
  } else {
    if (enabledTabs.has(tab.id)) {
      chrome.tabs.sendMessage(tab.id, { type: 'show-controlbar' })
    } else {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/src/entries/contentScript/primary/main.js'],
      })
      chrome.tabs.sendMessage(tab.id, { type: 'show-controlbar' })
      enabledTabs.add(tab.id)
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
    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'offscreen',
      data: { streamId, ...data },
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
}

chrome.runtime.onMessage.addListener(
  async (message, _sender, _sendResponse) => {
    if (message.target !== 'background') {
      return
    }
    switch (message.type) {
      case 'recording-complete':
        if (recordingMode === 'desktop') {
          resultTabId && chrome.tabs.update(resultTabId, { active: true })
        } else {
          chrome.tabs.create({
            url: `/src/entries/tabs/main.html?videoUrl=${encodeURIComponent(
              message.videoUrl
            )}`,
          })
        }
        chrome.action.setBadgeText({ text: '' })
        useStore.setState({ isRecording: false })
        isRecording = false
        recordingTabId = null
        recordingMode = null
        break
      case 'start-recording':
        startRecording(message.data)
        break
      default:
        throw new Error('Unrecognized message:', message.type)
    }
  }
)
