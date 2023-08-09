/* eslint-disable @typescript-eslint/ban-ts-comment */

import { openDB } from 'idb'
import { RecordingOptions } from '~/types'

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target === 'offscreen') {
    switch (message.type) {
      case 'start-recording':
        startRecording(message.data)
        break
      case 'stop-recording':
        stopRecording()
        break
      default:
        throw new Error('Unrecognized message:', message.type)
    }
  }
})

let recorder: MediaRecorder | undefined
let data: Blob[] = []

async function startRecording({
  streamId,
  width,
  height,
  recordingId,
  audio,
}: RecordingOptions) {
  if (recorder?.state === 'recording') {
    throw new Error('Called startRecording while recording is in progress.')
  }

  const media = await navigator.mediaDevices.getUserMedia({
    audio: audio
      ? {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId,
          },
        }
      : false,
    video: {
      // @ts-ignore
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
        maxWidth: width,
        maxHeight: height,
      },
    },
  })

  if (audio) {
    const output = new AudioContext()
    const source = output.createMediaStreamSource(media)
    source.connect(output.destination)
  }

  // Start recording.
  recorder = new MediaRecorder(media, { mimeType: 'video/webm' })
  recorder.ondataavailable = (event) => data.push(event.data)
  recorder.onstop = async () => {
    const db = await openDB('sgreen', 3, {
      upgrade(db) {
        db.createObjectStore('recordings', {
          keyPath: 'id',
        })
      },
    })
    const tx = db.transaction('recordings', 'readwrite')
    await tx.store.add({
      data,
      id: recordingId,
      type: 'video/webm',
      created: Date.now(),
    })
    await tx.done
    db.close()

    chrome.runtime.sendMessage({
      type: 'recording-complete',
      target: 'background',
    })
    // Clear state ready for next recording
    recorder = undefined
    data = []
  }
  recorder.onerror = (event) => {
    console.error('MediaRecorder error:', event)
  }
  recorder.start()

  // Record the current state in the URL. This provides a very low-bandwidth
  // way of communicating with the service worker (the service worker can check
  // the URL of the document and see the current recording state). We can't
  // store that directly in the service worker as it may be terminated while
  // recording is in progress. We could write it to storage but that slightly
  // increases the risk of things getting out of sync.
  window.location.hash = 'recording'
}

async function stopRecording() {
  recorder?.stop()

  // Stopping the tracks makes sure the recording icon in the tab is removed.
  recorder?.stream.getTracks().forEach((t) => t.stop())

  // Update current state in URL
  window.location.hash = ''

  // Note: In a real extension, you would want to write the recording to a more
  // permanent location (e.g IndexedDB) and then close the offscreen document,
  // to avoid keeping a document around unnecessarily. Here we avoid that to
  // make sure the browser keeps the Object URL we create (see above) and to
  // keep the sample fairly simple to follow.
}
