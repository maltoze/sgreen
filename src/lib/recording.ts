import fixWebmDuration from 'fix-webm-duration'
import { defaultRecordingMode, tabCaptureModes } from '~/constants'
import { RecordingOptions } from '~/types'

let recorder: MediaRecorder | undefined
let data: Blob[] = []
let startTime: number
let media: MediaStream | undefined

const frameRate = 30
const bitRate = 8 * 1024 * 1024
const devicePixelRatio = window.devicePixelRatio || 1

function getChromeMediaSource(
  recordingMode: RecordingOptions['recordingMode'],
) {
  return tabCaptureModes.includes(recordingMode) ? 'tab' : 'desktop'
}

function createAreaRecorderMediaStream(area: RecordingOptions['area']) {
  const canvas = document.createElement('canvas')
  canvas.width = area.width
  canvas.height = area.height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not get canvas context.')

  const video = document.createElement('video')
  video.srcObject = media as MediaStream

  video.addEventListener('play', () => {
    const drawFrame = () => {
      context.drawImage(
        video,
        area.x * devicePixelRatio,
        area.y * devicePixelRatio,
        area.width * devicePixelRatio - 2, // workaround for black line on the right side
        area.height * devicePixelRatio - 1,
        0,
        0,
        area.width,
        area.height,
      )
    }
    drawFrame()
    setInterval(drawFrame, 1000 / frameRate)
  })

  video.play()

  return canvas.captureStream(frameRate)
}

export async function start(
  {
    streamId,
    width,
    height,
    audio,
    recordingMode = defaultRecordingMode,
    area,
  }: RecordingOptions,
  callback?: () => void,
) {
  if (recorder?.state === 'recording') {
    throw new Error('Called startRecording while recording is in progress.')
  }

  const chromeMediaSource = getChromeMediaSource(recordingMode)
  const videoConstraints: MediaTrackConstraints = {
    // @ts-ignore
    mandatory: {
      chromeMediaSource,
      chromeMediaSourceId: streamId,
      minFrameRate: frameRate,
      ...(width && {
        minWidth: width * devicePixelRatio,
        maxWidth: width * devicePixelRatio,
      }),
      ...(height && {
        minHeight: height * devicePixelRatio,
        maxHeight: height * devicePixelRatio,
      }),
    },
  }

  const mediaStreamConstraints: MediaStreamConstraints = {
    audio: audio
      ? {
          // @ts-ignore
          mandatory: {
            chromeMediaSource,
            chromeMediaSourceId: streamId,
          },
        }
      : false,
    video: videoConstraints,
  }

  media = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints)

  if (audio) {
    const audioContext = new AudioContext()
    const audioSource = audioContext.createMediaStreamSource(media)
    audioSource.connect(audioContext.destination)
  }

  let recorderMedia = media
  if (recordingMode === 'area') {
    recorderMedia = createAreaRecorderMediaStream(area)
    const audioTracks = media.getAudioTracks()
    if (audioTracks.length > 0) {
      recorderMedia.addTrack(audioTracks[0])
    }
  }

  recorder = new MediaRecorder(recorderMedia, {
    mimeType: 'video/webm',
    videoBitsPerSecond: bitRate,
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
  recorder?.stream.getTracks().forEach((t) => t.stop())
  media?.getTracks().forEach((t) => t.stop())
}
