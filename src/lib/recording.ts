import { RecordingOptions } from '~/types'

let recorder: MediaRecorder | undefined
let data: Blob[] = []

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
      minFrameRate: 30,
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
    mimeType: 'video/webm;codecs=h264',
    // videoBitsPerSecond: 12 * 1024 * 1024,
  })
  recorder.ondataavailable = (event) => data.push(event.data)
  recorder.onstop = async () => {
    const blob = new Blob(data, { type: 'video/webm' })

    callback?.()

    chrome.runtime.sendMessage({
      type: 'recording-complete',
      target: 'background',
      videoUrl: URL.createObjectURL(blob),
    })
    // Clear state ready for next recording
    recorder = undefined
    data = []
  }
  recorder.onerror = (event) => {
    console.error('MediaRecorder error:', event)
  }
  recorder.start()
}

export async function stop() {
  recorder?.stop()

  // Stopping the tracks makes sure the recording icon in the tab is removed.
  recorder?.stream.getTracks().forEach((t) => t.stop())
}
