import { offscreenUrl } from '~/constants'
import {
  getCurrentTab,
  hasOffscreenDocument,
  supportOffscreenRecording,
} from '~/lib/utils'
import { RecordingOptions } from '~/types'
import { useStore } from '../store'

chrome.action.onClicked.addListener(async (tab) => {
  const isRecording = useStore.getState().isRecording
  if (isRecording) {
    if (supportOffscreenRecording) {
      chrome.runtime.sendMessage({
        type: 'stop-recording',
        target: 'offscreen',
      })
    }
    tab.id && chrome.tabs.sendMessage(tab.id, { type: 'stop-recording' })
  } else {
    if (supportOffscreenRecording) {
      chrome.tabCapture.getMediaStreamId(
        {
          targetTabId: tab.id,
        },
        (streamId) => {
          tab.id &&
            chrome.tabs.sendMessage(tab.id, {
              type: 'show-controlbar',
              data: { streamId },
            })
        },
      )
    } else {
      tab.id &&
        chrome.tabs.sendMessage(tab.id, {
          type: 'show-controlbar',
          data: { streamId: '' },
        })
    }
  }
})

async function startRecording(data: RecordingOptions) {
  const { recordingMode } = data
  const tab = await getCurrentTab()
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
    const hasOffscreen = await hasOffscreenDocument()
    if (!hasOffscreen) {
      await chrome.offscreen.createDocument({
        url: offscreenUrl,
        justification: 'Recording from chrome.tabCapture API',
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
      })
    }
    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'offscreen',
      data,
    })
  }
}

chrome.runtime.onMessage.addListener(
  async (message, _sender, _sendResponse) => {
    if (message.target !== 'background') {
      return
    }
    switch (message.type) {
      case 'recording-complete':
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
