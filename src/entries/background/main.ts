import { offscreenUrl } from '~/constants'
import { hasOffscreenDocument } from '~/lib/utils'
import { RecordingOptions } from '~/types'

async function startRecording(data: RecordingOptions) {
  const hasOffscreen = await hasOffscreenDocument()
  if (hasOffscreen) return

  await chrome.offscreen.createDocument({
    url: offscreenUrl,
    justification: 'Recording from chrome.tabCapture API',
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
  })
  chrome.runtime.sendMessage({
    type: 'start-recording',
    target: 'offscreen',
    data,
  })
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
