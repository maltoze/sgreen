import {
  CaretDownIcon,
  DashboardIcon,
  DesktopIcon,
  PaddingIcon,
} from '@radix-ui/react-icons'
import clsx from 'clsx'
import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import Countdown from './components/Countdown'
import StrokeKeysDisplay from './components/StrokeKeysDisplay'
import { setDockVisible, useStore } from './store'

type RecordMode = 'tab' | 'desktop' | 'app'

interface IRecordingMode {
  name: RecordMode
  label?: string
  icon: React.ReactNode
  tooltip: string
  onClick?: () => void
}

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

interface AppProps {
  appRoot: ShadowRoot
}

const clearRecordTimeout = 3000

function App({ appRoot }: AppProps) {
  const [recordMode, setRecordMode] = useState<RecordMode>('tab')
  const [scrollbarHidden, setScrollbarHidden] = useState(false)

  const { dockVisible, audio, setAudio, showKeyStrokes, setShowKeyStrokes } =
    useStore((state) => ({
      dockVisible: state.dockVisible,
      audio: state.audio,
      setAudio: state.setAudio,
      showKeyStrokes: state.showKeyStrokes,
      setShowKeyStrokes: state.setShowKeyStrokes,
    }))
  const [showCountdown, setShowCountdown] = useState(false)

  function handleChangeScrollbarHidden(hidden: boolean) {
    if (hidden) {
      hideScrollBar()
    } else {
      showScrollBar()
    }
    setScrollbarHidden(hidden)
  }

  const [isRecording, setIsRecording] = useState(false)
  useEffect(() => {
    if (isRecording && showKeyStrokes) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isRecording, showKeyStrokes])

  const [strokeKeys, setStrokeKeys] = useState<string[]>([])
  const strokeTimeoutRef = useRef<number | null>(null)

  function handleKeyDown(e: KeyboardEvent) {
    if (strokeTimeoutRef.current) {
      clearTimeout(strokeTimeoutRef.current)
    }
    setStrokeKeys((prev) => [...prev, e.key])
    strokeTimeoutRef.current = setTimeout(() => {
      setStrokeKeys([])
    }, clearRecordTimeout)
  }

  useEffect(() => {
    return () => {
      if (strokeTimeoutRef.current) {
        clearTimeout(strokeTimeoutRef.current)
      }
    }
  }, [])

  const startRecording = useCallback(() => {
    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'background',
      data: {
        width: window.innerWidth,
        height: window.innerHeight,
        recordingId: uuidv4(),
        audio,
      },
    })
    setIsRecording(true)
    setShowCountdown(false)
  }, [audio])

  async function handleStart() {
    setDockVisible(false)
    setShowCountdown(true)
  }

  const recordingModes: IRecordingMode[] = [
    {
      name: 'tab',
      icon: <PaddingIcon className="h-4 w-4" />,
      tooltip: 'Current tab',
      onClick: () => setRecordMode('tab'),
    },
    {
      name: 'desktop',
      icon: <DesktopIcon className="h-4 w-4" />,
      tooltip: 'Desktop',
      onClick: () => setRecordMode('desktop'),
    },
    {
      name: 'app',
      icon: <DashboardIcon className="h-4 w-4" />,
      tooltip: 'Apps',
      onClick: () => setRecordMode('app'),
    },
  ]

  return (
    <>
      <AnimatePresence>
        {showCountdown && <Countdown count={3} onFinish={startRecording} />}
      </AnimatePresence>
      <StrokeKeysDisplay strokeKeys={strokeKeys.slice(-5)} />
      {dockVisible && (
        <div className="fixed bottom-4 left-4 z-[2147483646] flex space-x-2 rounded-xl bg-background/40 p-1.5 text-slate-950 shadow-md backdrop-blur">
          <div className="flex space-x-2">
            {recordingModes.map((mode) => (
              <TooltipProvider key={mode.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={mode.onClick}
                      className={clsx({
                        'cursor-default text-green-500 hover:bg-transparent hover:text-green-500':
                          mode.name === recordMode,
                      })}
                    >
                      {mode.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{mode.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2/3 border-l-2 border-slate-950"></div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="inline-flex select-none items-center space-x-1"
                >
                  <span>Options</span>
                  <CaretDownIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal
                // @ts-ignore
                container={appRoot}
              >
                <DropdownMenuContent
                  className="w-52 rounded-md bg-background/60 backdrop-blur"
                  sideOffset={10}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuCheckboxItem
                    checked={audio}
                    onCheckedChange={setAudio}
                  >
                    Enable Audio
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={showKeyStrokes}
                    onCheckedChange={setShowKeyStrokes}
                  >
                    Show Keystrokes
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>
                    Show Mouse Clicks
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    onCheckedChange={handleChangeScrollbarHidden}
                    checked={scrollbarHidden}
                  >
                    Hide Scrollbar
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2/3 border-l-2 border-slate-950"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStart}
              className="select-none"
            >
              Start
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
