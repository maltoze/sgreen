import { useCallback, useEffect } from 'react'
import { tabCaptureModes } from '~/constants'
import { start, stop } from '~/lib/recording'
import { ChromeRuntimeMessage, RecordingOptions } from '~/types'
import { setIsRecording, useStore } from '../../store'
import Controlbar from './components/Controlbar'
import Countdown from './components/Countdown'
import MouseClick from './components/MouseClick'
import SelectingArea from './components/SelectingArea'
import StrokeKeysDisplay from './components/StrokeKeysDisplay'
import useScrollbar from './hooks/use-scrollbar'

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
    showControlbar,
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
    showControlbar: state.showControlbar,
  }))

  useEffect(() => {
    async function handleChromeMessage(
      message: ChromeRuntimeMessage<RecordingOptions>,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void
    ) {
      switch (message.type) {
        case 'show-controlbar':
          useStore.setState({ showControlbar: true })
          break
        case 'start-recording':
          setIsRecording(true)
          !tabCaptureModes.includes(recordingMode) &&
            message.data &&
            start(message.data, () => setIsRecording(false))
          break
        case 'stop-recording':
          setIsRecording(false)
          !tabCaptureModes.includes(recordingMode) && stop()
          break
        default:
          break
      }
    }
    chrome.runtime.onMessage.addListener(handleChromeMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleChromeMessage)
    }
  }, [recordingMode])

  useScrollbar({ isRecording, scrollbarHidden })

  const startRecording = useCallback(() => {
    useStore.setState({ showCountdown: false, showControlbar: false })

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
    useStore.setState({ showControlbar: false })
  }

  return (
    <>
      {showCountdown && (
        <Countdown
          count={countdown}
          onFinish={startRecording}
          key={countdown}
        />
      )}
      {isRecording && showKeystrokes && <StrokeKeysDisplay />}
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
