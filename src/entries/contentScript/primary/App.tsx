import { useCallback, useEffect, useRef, useState } from 'react'
import { start, stop } from '~/lib/recording'
import { getStreamId, supportOffscreenRecording } from '~/lib/utils'
import { ChromeRuntimeMessage, RecordingOptions } from '~/types'
import { setIsRecording, useStore } from '../../store'
import Countdown from './components/Countdown'
import StrokeKeysDisplay from './components/StrokeKeysDisplay'
import useScrollbar from './hooks/use-scrollbar'

const clearRecordTimeout = 3000

function App() {
  const [showCountdown, setShowCountdown] = useState(false)
  const { scrollbarHidden, audio, showKeystrokes, streamId } = useStore(
    (state) => ({
      scrollbarHidden: state.scrollbarHidden,
      audio: state.audio,
      showKeystrokes: state.showKeystrokes,
      streamId: state.streamId,
    }),
  )
  const isRecording = useStore((state) => state.isRecording)

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
    async function handleChromeMessage(
      message: ChromeRuntimeMessage<RecordingOptions>,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) {
      switch (message.type) {
        case 'show-controlbar':
          if (message.data?.streamId) {
            useStore.setState({ streamId: message.data.streamId })
          }
          break
        case 'start-recording':
          if (message.data?.recordingMode === 'tab') {
            setRecordingOptions(message.data)
            setShowCountdown(true)
          } else {
            message.data && start(message.data, () => setIsRecording(false))
            setIsRecording(true)
          }
          break
        case 'stop-recording':
          setIsRecording(false)
          if (supportOffscreenRecording) {
            chrome.runtime.sendMessage({
              type: 'stop-recording',
              target: 'offscreen',
            })
            window.removeEventListener('keydown', handleKeyDown)
          } else {
            stop()
          }
          break
        default:
          break
      }
    }
    chrome.runtime.onMessage.addListener(handleChromeMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleChromeMessage)
    }
  }, [handleKeyDown])

  const [strokeKeys, setStrokeKeys] = useState<string[]>([])
  const strokeTimeoutRef = useRef<number | null>(null)

  useScrollbar({ isRecording, scrollbarHidden })

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
    if (!streamId) {
      return
    }

    setShowCountdown(false)
    const recordingDelay = 100
    setTimeout(() => {
      setIsRecording(true)
      if (supportOffscreenRecording) {
        chrome.runtime.sendMessage({
          type: 'start-recording',
          target: 'background',
          data: {
            audio,
            width: window.innerWidth,
            height: window.innerHeight,
            streamId,
            recordingMode: 'tab',
          },
        })
      } else {
        start({
          audio,
          width: window.innerWidth,
          height: window.innerHeight,
          streamId,
        })
      }
    }, recordingDelay)
  }, [audio, streamId])

  return (
    <>
      {showCountdown && <Countdown count={3} onFinish={startRecording} />}
      <StrokeKeysDisplay strokeKeys={strokeKeys} />
    </>
  )
}

export default App
