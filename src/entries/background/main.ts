import { offscreenUrl, tabCaptureModes } from '~/constants'
import { getCurrentTab, getStreamId, hasOffscreenDocument } from '~/lib/utils'
import { RecordingMode, RecordingOptions } from '~/types'
import { useStore } from '../store'

let isRecording = false
let recordingMode: RecordingMode | null = null
let recordingTabId: number | null = null
const enabledTabs = new Set()

function stopRecording() {
  chrome.runtime.sendMessage({
    type: 'stop-recording',
    target: 'offscreen',
  })
  recordingTabId &&
    chrome.tabs.sendMessage(recordingTabId, { type: 'stop-recording' })
  useStore.setState({ isRecording: false })
  isRecording = false
  recordingTabId = null
  recordingMode = null
  chrome.action.setBadgeText({ text: '' })
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (
    recordingMode &&
    tabCaptureModes.includes(recordingMode) &&
    changeInfo.status === 'loading' &&
    enabledTabs.has(tabId)
  ) {
    isRecording && stopRecording()
    enabledTabs.delete(tabId)
    // chrome.scripting.executeScript({
    //   target: { tabId },
    //   files: ['/src/entries/contentScript/primary/main.js'],
    // })
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
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/src/entries/contentScript/primary/main.js'],
      })
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

  recordingMode = data.recordingMode
  const tab = await getCurrentTab()
  if (!tab.id) return

  if (recordingMode && ['tab', 'area'].includes(recordingMode)) {
    const streamId = await getStreamId(tab.id)
    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'offscreen',
      data: { streamId, ...data },
    })
  } else {
    chrome.desktopCapture.chooseDesktopMedia(
      ['screen', 'window', 'audio', 'tab'],
      tab,
      (streamId, { canRequestAudioTrack }) => {
        tab.id &&
          chrome.tabs.sendMessage(tab.id, {
            type: 'start-recording',
            data: {
              streamId,
              recordingMode: 'desktop',
              audio: canRequestAudioTrack,
            },
          })
      }
    )
  }
  chrome.action.setBadgeText({ text: 'REC' })
  chrome.action.setBadgeTextColor({ color: '#ffffff' })
  chrome.action.setBadgeBackgroundColor({ color: '#dc2626' })
  isRecording = true
  recordingTabId = tab.id
}

chrome.runtime.onMessage.addListener(
  async (message, _sender, _sendResponse) => {
    if (message.target !== 'background') {
      return
    }
    switch (message.type) {
      case 'recording-complete':
        isRecording = false
        chrome.action.setBadgeText({ text: '' })
        chrome.tabs.create({
          url: `/src/entries/tabs/main.html?videoUrl=${encodeURIComponent(
            message.videoUrl
          )}`,
        })
        break
      case 'start-recording':
        startRecording(message.data)
        break
      default:
        throw new Error('Unrecognized message:', message.type)
    }
  }
)
