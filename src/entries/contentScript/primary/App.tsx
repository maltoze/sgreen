import { useCallback, useEffect, useRef, useState } from 'react'
import Countdown from './components/Countdown'
import StrokeKeysDisplay from './components/StrokeKeysDisplay'
import { setIsRecording, setShowCountdown, useStore } from './store'

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

function showScrollBar() {
  style.sheet?.deleteRule(0)
}

const clearRecordTimeout = 3000

function App() {
  const [scrollbarHidden, setScrollbarHidden] = useState(false)
  const { audio, streamId, showKeystrokes, showCountdown, isRecording } =
    useStore((state) => ({
      audio: state.audio,
      streamId: state.streamId,
      showKeystrokes: state.showKeystrokes,
      showCountdown: state.showCountdown,
      isRecording: state.isRecording,
    }))

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
    if (showKeystrokes) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown, showKeystrokes])

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
    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'background',
      data: {
        width: window.innerWidth,
        height: window.innerHeight,
        audio,
        streamId,
      },
    })
  }, [audio, streamId])

  return (
    <>
      {showCountdown && <Countdown count={3} onFinish={startRecording} />}
      <StrokeKeysDisplay strokeKeys={strokeKeys} />
    </>
  )
}

export default App
