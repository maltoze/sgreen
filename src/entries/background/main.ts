import { getCurrentTab } from '~/lib/utils'
import { RecordingOptions } from '~/types'

async function startRecording(data: RecordingOptions) {
  const { recordingMode } = data
  const tab = await getCurrentTab()
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
