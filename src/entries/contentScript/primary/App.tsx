import fixWebmDuration from 'fix-webm-duration'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChromeRuntimeMessage, RecordingOptions } from '~/types'
import Countdown from './components/Countdown'
import StrokeKeysDisplay from './components/StrokeKeysDisplay'
import { setIsRecording, useStore } from './store'

const style = document.createElement('style')
document.head.appendChild(style)

function hideScrollBar() {
  style.sheet?.insertRule(
    `
    ::-webkit-scrollbar {
      display: none;
    }
  `,
    0,
  )
}

function deleteRule() {
  if (style.sheet?.cssRules.length && style.sheet?.cssRules.length > 0) {
    style.sheet?.deleteRule(0)
  }
}

const clearRecordTimeout = 3000

let recorder: MediaRecorder | undefined
let data: Blob[] = []
let startTime: number

async function startRecordingMedia({
  streamId,
  width,
  height,
  audio,
  recordingMode = 'tab',
}: RecordingOptions) {
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
  recorder = new MediaRecorder(media, { mimeType: 'video/webm' })
  recorder.ondataavailable = (event) => data.push(event.data)
  recorder.onstop = async () => {
    const duration = Date.now() - startTime
    const blob = new Blob(data, { type: 'video/webm' })
    const fixedBlob = await fixWebmDuration(blob, duration, { logger: false })

    setIsRecording(false)
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

async function stopRecording() {
  recorder?.stop()

  // Stopping the tracks makes sure the recording icon in the tab is removed.
  recorder?.stream.getTracks().forEach((t) => t.stop())
}

function App() {
  const [recordingOptions, setRecordingOptions] = useState<RecordingOptions>()
  const [showCountdown, setShowCountdown] = useState(false)
  const { scrollbarHidden, audio, showKeystrokes, streamId } =
    recordingOptions ?? {}
  const isRecording = useStore((state) => state.isRecording)

  useEffect(() => {
    function handleChromeMessage(
      message: ChromeRuntimeMessage<RecordingOptions>,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) {
      switch (message.type) {
        case 'start-recording':
          if (message.data?.recordingMode === 'tab') {
            setRecordingOptions(message.data)
            setShowCountdown(true)
          } else {
            message.data && startRecordingMedia(message.data)
            setIsRecording(true)
          }
          break
        case 'stop-recording':
          stopRecording()
          setIsRecording(false)
          break
        default:
          break
      }
    }
    chrome.runtime.onMessage.addListener(handleChromeMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleChromeMessage)
    }
  }, [])

  useEffect(() => {
    if (scrollbarHidden && isRecording) {
      hideScrollBar()
    }
    return () => {
      deleteRule()
    }
  }, [isRecording, scrollbarHidden])

  const [strokeKeys, setStrokeKeys] = useState<string[]>([])
  const strokeTimeoutRef = useRef<number | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording) return

      if (strokeTimeoutRef.current) {
        clearTimeout(strokeTimeoutRef.current)
      }

      const keyboardModifiers = {
        Shift: e.shiftKey,
        Control: e.ctrlKey,
        Alt: e.altKey,
        Meta: e.metaKey,
      }
      const activeModifiers = Object.keys(keyboardModifiers).filter(
        (modifier) =>
          keyboardModifiers[modifier as keyof typeof keyboardModifiers],
      )

      if (activeModifiers.includes(e.key)) {
        setStrokeKeys(activeModifiers)
      } else {
        setStrokeKeys([...activeModifiers, e.key])
      }
      strokeTimeoutRef.current = setTimeout(() => {
        setStrokeKeys([])
      }, clearRecordTimeout)
    },
    [isRecording],
  )

  useEffect(() => {
    if (showKeystrokes && isRecording) {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown, isRecording, showKeystrokes])

  useEffect(() => {
    return () => {
      if (strokeTimeoutRef.current) {
        clearTimeout(strokeTimeoutRef.current)
      }
    }
  }, [])

  const startRecording = useCallback(() => {
    setShowCountdown(false)
    setIsRecording(true)
    if (streamId) {
      startRecordingMedia({
        audio,
        width: window.innerWidth,
        height: window.innerHeight,
        streamId,
      })
    }
  }, [audio, streamId])

  return (
    <>
      {showCountdown && <Countdown count={3} onFinish={startRecording} />}
      <StrokeKeysDisplay strokeKeys={strokeKeys} />
    </>
  )
}

export default App
