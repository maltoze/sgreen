import { RecordingOptions } from '~/types'

let streamId: string
let recording = false
let dockVisible = false

chrome.action.onClicked.addListener(async (tab) => {
  if (dockVisible) {
    tab.id && chrome.tabs.sendMessage(tab.id, { type: 'hide-dock' })
    dockVisible = false
  } else {
    tab.id && chrome.tabs.sendMessage(tab.id, { type: 'show-dock' })
    dockVisible = true
  }

  if (recording) {
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen',
    })
    recording = false
  } else {
    chrome.tabCapture.getMediaStreamId(
      {
        targetTabId: tab.id,
      },
      async (streamId_) => {
        streamId = streamId_
      },
    )
  }
})

async function startRecording(data: Omit<RecordingOptions, 'streamId'>) {
  if (recording) return

  recordingId = data.recordingId
  recording = true
  await chrome.offscreen.createDocument({
    url: '/src/entries/background/offscreen.html',
    justification: 'Recording from chrome.tabCapture API',
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
  })
  chrome.runtime.sendMessage({
    type: 'start-recording',
    target: 'offscreen',
    data: { streamId, ...data },
  })
}

let recordingId: string | null = null

chrome.runtime.onMessage.addListener(async (message, sender, _sendResponse) => {
  if (message.target !== 'background') {
    return
  }
  switch (message.type) {
    case 'recording-complete':
      chrome.offscreen.closeDocument()
      recordingId &&
        chrome.tabs.create({
          url: `/src/entries/tabs/main.html?recordingId=${encodeURIComponent(
            recordingId,
          )}`,
        })
      break
    case 'start-recording':
      sender.tab && startRecording(message.data)
      break
    default:
      throw new Error('Unrecognized message:', message.type)
  }
})
