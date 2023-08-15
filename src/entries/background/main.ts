import { offscreenUrl } from '~/constants'
import { getCurrentTab, getStreamId, hasOffscreenDocument } from '~/lib/utils'
import { RecordingOptions } from '~/types'

let isRecording = false
chrome.action.onClicked.addListener(async (tab) => {
  if (isRecording) {
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen',
    })
    tab.id && chrome.tabs.sendMessage(tab.id, { type: 'stop-recording' })
    isRecording = false
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

  const { recordingMode } = data
  const tab = await getCurrentTab()
  if (!tab.id) return

  if (recordingMode !== 'tab') {
    chrome.desktopCapture.chooseDesktopMedia(
      [recordingMode === 'desktop' ? 'screen' : 'window', 'audio'],
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
  } else {
    const streamId = await getStreamId(tab.id)
    console.log('streamId------', streamId)

    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'offscreen',
      data: { streamId, ...data },
    })
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
