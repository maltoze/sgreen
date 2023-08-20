import { offscreenUrl, tabCaptureModes } from '~/constants'
import { getCurrentTab, getStreamId, hasOffscreenDocument } from '~/lib/utils'
import { RecordingMode, RecordingOptions } from '~/types'

let isRecording = false
let recordingMode: RecordingMode | undefined

chrome.action.onClicked.addListener(async (tab) => {
  if (isRecording && recordingMode && tabCaptureModes.includes(recordingMode)) {
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen',
    })
    tab.id && chrome.tabs.sendMessage(tab.id, { type: 'stop-recording' })
    isRecording = false
    chrome.action.setBadgeText({ text: '' })
  } else {
    tab.id &&
      chrome.tabs.sendMessage(tab.id, {
        type: 'show-controlbar',
      })
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
    chrome.action.setBadgeText({ text: 'REC' })
    chrome.action.setBadgeTextColor({ color: '#ffffff' })
    chrome.action.setBadgeBackgroundColor({ color: '#dc2626' })
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
      },
    )
  }
  isRecording = true
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
            message.videoUrl,
          )}`,
        })
        break
      case 'start-recording':
        startRecording(message.data)
        break
      default:
        throw new Error('Unrecognized message:', message.type)
    }
  },
)
