import { offscreenUrl } from '~/constants'
import { hasOffscreenDocument } from '~/lib/utils'
import { RecordingOptions } from '~/types'

async function startRecording(data: RecordingOptions) {
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

chrome.runtime.onMessage.addListener(async (message, sender, _sendResponse) => {
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
    case 'request-tab-id':
      sender.tab?.id &&
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'response-tab-id',
          tabId: sender.tab.id,
        })
      break
    default:
      throw new Error('Unrecognized message:', message.type)
  }
})
