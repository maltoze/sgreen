import { AnimatePresence } from 'framer-motion'
import { useCallback } from 'react'
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
      <AnimatePresence>
        {showControlbar && !isRecording && (
          <Controlbar appRoot={appRoot} onClose={handleOnClose} />
        )}
      </AnimatePresence>
      {recordingMode === 'area' && (isRecording || showControlbar) && (
        <SelectingArea />
      )}
      {showMouseClicks && isRecording && <MouseClick />}
    </>
  )
}

export default App
