async function startRecording_(tab: chrome.tabs.Tab, data) {
  // https://developer.chrome.com/docs/extensions/reference/offscreen/#before-chrome-116-check-if-an-offscreen-document-is-open
  const existingContexts = await chrome.runtime.getContexts({})
  let recording = false

  const offscreenDocument = existingContexts.find(
    (c) => c.contextType === 'OFFSCREEN_DOCUMENT',
  )

  // If an offscreen document is not already open, create one.
  if (!offscreenDocument) {
    // Create an offscreen document.
    await chrome.offscreen.createDocument({
      url: '/src/entries/background/offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Recording from chrome.tabCapture API',
    })
  } else {
    recording = offscreenDocument.documentUrl.endsWith('#recording')
  }

  if (recording) {
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen',
      data,
    })
    return
  }

  // Get a MediaStream for the active tab.
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id,
  })

  // Send the stream ID to the offscreen document to start recording.
  chrome.runtime.sendMessage({
    type: 'start-recording',
    target: 'offscreen',
    data: { streamId, ...data },
  })
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
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
      sender.tab && startRecording_(sender.tab, message.data)
      break
  }
})
