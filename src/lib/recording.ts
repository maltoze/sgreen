import fixWebmDuration from 'fix-webm-duration'
import { RecordingOptions } from '~/types'

let recorder: MediaRecorder | undefined
let data: Blob[] = []
let startTime: number

export async function start(
  { streamId, width, height, audio, recordingMode = 'tab' }: RecordingOptions,
  callback?: () => void,
) {
  if (recorder?.state === 'recording') {
    throw new Error('Called startRecording while recording is in progress.')
  }
  console.table({ streamId, width, height, audio, recordingMode })

  const videoConstraints = {
    mandatory: {
      chromeMediaSource: recordingMode,
      chromeMediaSourceId: streamId,
    },
  }
  if (width) {
    // @ts-ignore
    videoConstraints.mandatory.minWidth = width
    // @ts-ignore
    videoConstraints.mandatory.maxWidth = width
  }
  if (height) {
    // @ts-ignore
    videoConstraints.mandatory.minHeight = height
    // @ts-ignore
    videoConstraints.mandatory.maxHeight = height
  }

  const media = await navigator.mediaDevices.getUserMedia({
    audio: audio
      ? {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: recordingMode,
            chromeMediaSourceId: streamId,
          },
        }
      : false,
    // @ts-ignore
    video: videoConstraints,
  })

  if (audio) {
    const output = new AudioContext()
    const source = output.createMediaStreamSource(media)
    source.connect(output.destination)
  }

  // Start recording.
  recorder = new MediaRecorder(media, {
    mimeType: 'video/webm',
    // videoBitsPerSecond: 8 * 1024 * 1024,
  })
  recorder.ondataavailable = (event) => data.push(event.data)
  recorder.onstop = async () => {
    const duration = Date.now() - startTime
    const blob = new Blob(data, { type: 'video/webm' })
    const fixedBlob = await fixWebmDuration(blob, duration, { logger: false })

    callback?.()

    chrome.runtime.sendMessage({
      type: 'recording-complete',
      target: 'background',
      videoUrl: URL.createObjectURL(fixedBlob),
    })
    // Clear state ready for next recording
    recorder = undefined
    data = []
  }
  recorder.onerror = (event) => {
    console.error('MediaRecorder error:', event)
  }
  recorder.start()
  startTime = Date.now()
}

export async function stop() {
  recorder?.stop()

  // Stopping the tracks makes sure the recording icon in the tab is removed.
  recorder?.stream.getTracks().forEach((t) => t.stop())
}
