import fixWebmDuration from 'fix-webm-duration'
import { defaultRecordingMode, tabCaptureModes } from '~/constants'
import { RecordingOptions } from '~/types'
import backgrounds from './backgrounds'

const recorderMimeType = 'video/webm'
const frameRate = 30
const bitRate = 8 * 1024 * 1024
const devicePixelRatio = window.devicePixelRatio || 1
const px = 150
const py = 100

class Recorder {
  private recorder: MediaRecorder | undefined
  private data: Blob[] = []
  private startTime: number
  private media: MediaStream | undefined
  private drawTimerId: ReturnType<typeof setTimeout> | null

  constructor() {
    this.recorder = undefined
    this.data = []
    this.startTime = 0
    this.media = undefined
    this.drawTimerId = null
  }

  private getChromeMediaSource(
    recordingMode: RecordingOptions['recordingMode']
  ) {
    return tabCaptureModes.includes(recordingMode) ? 'tab' : 'desktop'
  }

  private createAreaRecorderMediaStream({
    area,
    enableBackground = false,
    selectedBackground,
  }: {
    area?: RecordingOptions['area']
    enableBackground?: boolean
    selectedBackground: number
  }) {
    if (!this.media) return

    const video = document.createElement('video')
    video.srcObject = this.media as MediaStream
    video.autoplay = true

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context.')

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const dx = enableBackground ? px : 0
    const dy = enableBackground ? py : 0

    video.addEventListener('play', () => {
      const areaWidth = area?.width ?? video.videoWidth
      const areaHeight = area?.height ?? video.videoHeight

      canvas.width = areaWidth + (enableBackground ? 2 * px : 0)
      canvas.height = areaHeight + (enableBackground ? 2 * py : 0)

      if (enableBackground) {
        // Draw a gradient background
        const gradient = ctx.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height
        )
        const background = backgrounds[selectedBackground]
        gradient.addColorStop(0, background.from)
        gradient.addColorStop(1, background.to)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      const drawFrame = () => {
        ctx.drawImage(
          video,
          (area?.x ?? 0) * devicePixelRatio,
          (area?.y ?? 0) * devicePixelRatio,
          areaWidth * devicePixelRatio - 2, // workaround for black line on the right side
          areaHeight * devicePixelRatio - 1,
          dx,
          dy,
          areaWidth,
          areaHeight
        )
        this.drawTimerId = setTimeout(drawFrame, 1000 / frameRate)
      }

      drawFrame()
    })

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
      enableBackground,
      selectedBackground,
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

    const recorderMedia = this.createAreaRecorderMediaStream({
      area,
      enableBackground,
      selectedBackground,
    })
    if (!recorderMedia) {
      throw new Error('Could not create recorder media stream.')
    }

    const audioTracks = this.media.getAudioTracks()
    if (audioTracks.length > 0) {
      recorderMedia.addTrack(audioTracks[0])
    }

    this.recorder = new MediaRecorder(recorderMedia, {
      mimeType: recorderMimeType,
      videoBitsPerSecond: bitRate,
    })

    this.recorder.ondataavailable = (event) => {
      this.data.push(event.data)
    }

    this.media.addEventListener('inactive', () => {
      this.recorder?.stop()
    })

    this.recorder.onstop = async () => {
      const duration = Date.now() - this.startTime
      const blob = new Blob(this.data, { type: recorderMimeType })
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
    this.drawTimerId && clearTimeout(this.drawTimerId)
  }
}

export default Recorder
