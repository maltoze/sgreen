import { useCallback, useEffect, useRef, useState } from 'react'
import { keyboardCodes, tabCaptureModes } from '~/constants'
import { start } from '~/lib/recording'
import { isMac, isWindows } from '~/lib/utils'
import { ChromeRuntimeMessage, RecordingOptions } from '~/types'
import { setIsRecording, useStore } from '../../store'
import Controlbar from './components/Controlbar'
import Countdown from './components/Countdown'
import MouseClick from './components/MouseClick'
import SelectingArea from './components/SelectingArea'
import StrokeKeysDisplay from './components/StrokeKeysDisplay'
import useScrollbar from './hooks/use-scrollbar'

const clearRecordTimeout = 3000
const metaKey = isMac() ? '⌘' : isWindows() ? '⊞' : 'Meta'

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
    area,
    showMouseClicks,
  } = useStore((state) => ({
    scrollbarHidden: state.scrollbarHidden,
    audio: state.audio,
    showKeystrokes: state.showKeystrokes,
    recordingMode: state.recordingMode,
    showCountdown: state.showCountdown,
    isRecording: state.isRecording,
    countdown: state.countdown,
    area: state.area,
    showMouseClicks: state.showMouseClicks,
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

    const replaceMetaKey = () => {
      if (activeModifiers.includes('Meta')) {
        activeModifiers.splice(activeModifiers.indexOf('Meta'), 1, metaKey)
      }
    }

    if (activeModifiers.includes(e.key)) {
      replaceMetaKey()
      setStrokeKeys(activeModifiers)
    } else {
      replaceMetaKey()
      setStrokeKeys([...activeModifiers, keyboardCodes[e.code] ?? e.code])
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
          !tabCaptureModes.includes(recordingMode) &&
            message.data &&
            start(message.data, () => setIsRecording(false))
          break
        case 'stop-recording':
          setIsRecording(false)
          tabCaptureModes.includes(recordingMode) &&
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
  const strokeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useScrollbar({ isRecording, scrollbarHidden })

  useEffect(() => {
    if (
      showKeystrokes &&
      isRecording &&
      tabCaptureModes.includes(recordingMode)
    ) {
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
    setIsRecording(true)
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'start-recording',
        target: 'background',
        data: {
          audio,
          width: window.innerWidth,
          height: window.innerHeight,
          recordingMode,
          ...(recordingMode === 'area' ? { area } : {}),
        },
      })
    }, recordingDelay)
  }, [audio, recordingMode, area])

  function handleOnClose() {
    setShowControlbar(false)
  }

  return (
    <>
      {showCountdown && (
        <Countdown count={countdown} onFinish={startRecording} />
      )}
      {isRecording && showKeystrokes && (
        <StrokeKeysDisplay strokeKeys={strokeKeys} />
      )}
      {showControlbar && (
        <Controlbar appRoot={appRoot} onClose={handleOnClose} />
      )}
      {recordingMode === 'area' && (isRecording || showControlbar) && (
        <SelectingArea />
      )}
      {showMouseClicks && isRecording && <MouseClick />}
    </>
  )
}

export default App
