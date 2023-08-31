import fixWebmDuration from 'fix-webm-duration'
import { defaultRecordingMode, tabCaptureModes } from '~/constants'
import { RecordingOptions } from '~/types'

const recorderMimeType = 'video/webm'
const frameRate = 30
const bitRate = 8 * 1024 * 1024
const devicePixelRatio = window.devicePixelRatio || 1

class Recorder {
  private recorder: MediaRecorder | undefined
  private data: Blob[] = []
  private startTime: number
  private media: MediaStream | undefined
  private drawIntervalId: ReturnType<typeof setInterval>

  constructor() {
    this.recorder = undefined
    this.data = []
    this.startTime = 0
    this.media = undefined
    this.drawIntervalId = setInterval(() => {}, 0)
  }

  private getChromeMediaSource(
    recordingMode: RecordingOptions['recordingMode']
  ) {
    return tabCaptureModes.includes(recordingMode) ? 'tab' : 'desktop'
  }

  private createAreaRecorderMediaStream(area: RecordingOptions['area']) {
    const canvas = document.createElement('canvas')
    canvas.width = area.width
    canvas.height = area.height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not get canvas context.')

    const video = document.createElement('video')
    video.srcObject = this.media as MediaStream

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
          area.height
        )
      }
      drawFrame()
      this.drawIntervalId = setInterval(drawFrame, 1000 / frameRate)
    })

    video.play()

    return canvas.captureStream(frameRate)
  }

  public async start(
    {
      streamId,
      width,
      height,
      audio,
      recordingMode = defaultRecordingMode,
      area,
    }: RecordingOptions,
    callback?: (url: string) => void
  ) {
    if (this.recorder?.state === 'recording') {
      throw new Error('Called startRecording while recording is in progress.')
    }

    const chromeMediaSource = this.getChromeMediaSource(recordingMode)
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

    this.media = await navigator.mediaDevices.getUserMedia(
      mediaStreamConstraints
    )

    if (audio) {
      const audioContext = new AudioContext()
      const audioSource = audioContext.createMediaStreamSource(this.media)
      audioSource.connect(audioContext.destination)
    }

    let recorderMedia = this.media
    if (recordingMode === 'area') {
      recorderMedia = this.createAreaRecorderMediaStream(area)
      const audioTracks = this.media.getAudioTracks()
      if (audioTracks.length > 0) {
        recorderMedia.addTrack(audioTracks[0])
      }
    }

    this.recorder = new MediaRecorder(recorderMedia, {
      mimeType: recorderMimeType,
      videoBitsPerSecond: bitRate,
    })

    this.recorder.ondataavailable = (event) => {
      this.data.push(event.data)
    }
    this.recorder.onstop = async () => {
      const duration = Date.now() - this.startTime
      const blob = new Blob(this.data, { type: this.data[0].type })
      const fixedBlob = await fixWebmDuration(blob, duration, { logger: false })

      const url = URL.createObjectURL(fixedBlob)
      chrome.runtime.sendMessage({
        type: 'recording-complete',
        target: 'background',
        videoUrl: url,
      })
      callback?.(url)

      this.recorder = undefined
      this.data = []
    }
    this.recorder.onerror = (event) => {
      console.error('MediaRecorder error:', event)
    }
    this.recorder.start()
    this.startTime = Date.now()
  }

  public async stop() {
    this.recorder?.stop()
    this.recorder?.stream.getTracks().forEach((t) => t.stop())
    this.media?.getTracks().forEach((t) => t.stop())
    clearInterval(this.drawIntervalId)
  }
}

export default Recorder
