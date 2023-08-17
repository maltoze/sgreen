import { useCallback, useEffect, useRef, useState } from 'react'
import { start } from '~/lib/recording'
import { ChromeRuntimeMessage, RecordingOptions } from '~/types'
import { setIsRecording, useStore } from '../../store'
import Controlbar from './components/Controlbar'
import Countdown from './components/Countdown'
import StrokeKeysDisplay from './components/StrokeKeysDisplay'
import useScrollbar from './hooks/use-scrollbar'

const clearRecordTimeout = 3000

interface AppProps {
  appRoot: ShadowRoot
}

function App({ appRoot }: AppProps) {
  const {
    scrollbarHidden,
    audio,
    showKeystrokes,
    recordingMode,
    showCountdown,
    isRecording,
    countdown,
  } = useStore((state) => ({
    scrollbarHidden: state.scrollbarHidden,
    audio: state.audio,
    showKeystrokes: state.showKeystrokes,
    recordingMode: state.recordingMode,
    showCountdown: state.showCountdown,
    isRecording: state.isRecording,
    countdown: state.countdown,
  }))

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  }, [])

  const [showControlbar, setShowControlbar] = useState(false)
  useEffect(() => {
    async function handleChromeMessage(
      message: ChromeRuntimeMessage<RecordingOptions>,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) {
      switch (message.type) {
        case 'show-controlbar':
          setShowControlbar(true)
          break
        case 'start-recording':
          setIsRecording(true)
          recordingMode !== 'tab' &&
            message.data &&
            start(message.data, () => setIsRecording(false))
          break
        case 'stop-recording':
          setIsRecording(false)
          recordingMode === 'tab' &&
            window.removeEventListener('keydown', handleKeyDown)
          break
        default:
          break
      }
    }
    chrome.runtime.onMessage.addListener(handleChromeMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleChromeMessage)
    }
  }, [handleKeyDown, recordingMode])

  const [strokeKeys, setStrokeKeys] = useState<string[]>([])
  const strokeTimeoutRef = useRef<number | null>(null)

  useScrollbar({ isRecording, scrollbarHidden })

  useEffect(() => {
    if (showKeystrokes && isRecording && recordingMode === 'tab') {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown, isRecording, recordingMode, showKeystrokes])

  useEffect(() => {
    return () => {
      if (strokeTimeoutRef.current) {
        clearTimeout(strokeTimeoutRef.current)
      }
    }
  }, [])

  const startRecording = useCallback(() => {
    useStore.setState({ showCountdown: false })
    setShowControlbar(false)

    const recordingDelay = 100
    setTimeout(() => {
      setIsRecording(true)
      chrome.runtime.sendMessage({
        type: 'start-recording',
        target: 'background',
        data: {
          audio,
          width: window.innerWidth,
          height: window.innerHeight,
          recordingMode,
        },
      })
      useStore.setState({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }, recordingDelay)
  }, [audio, recordingMode])

  return (
    <>
      {showCountdown && (
        <Countdown count={countdown} onFinish={startRecording} />
      )}
      <StrokeKeysDisplay strokeKeys={strokeKeys} />
      {showControlbar && (
        <Controlbar
          appRoot={appRoot}
          onClose={() => setShowControlbar(false)}
        />
      )}
    </>
  )
}

export default App
