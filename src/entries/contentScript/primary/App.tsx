import {
  CaretDownIcon,
  DashboardIcon,
  DesktopIcon,
  PaddingIcon,
} from '@radix-ui/react-icons'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
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

function App({ appRoot }: AppProps) {
  const [recordMode, setRecordMode] = useState<RecordMode>('tab')
  const [countDown, setCountDown] = useState<number | null>(null)
  const [scrollbarHidden, setScrollbarHidden] = useState(false)
  const [audio, setAudio] = useState(false)
  const dockVisible = useStore((state) => state.dockVisible)

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
    // if (isRecording) {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
    // }
  }, [])

  const [strokeKeys, setStrokeKeys] = useState<string[]>([])
  function handleKeyDown(e: KeyboardEvent) {
    setStrokeKeys((prev) => [...prev, e.code])
  }

  async function handleStart() {
    setDockVisible(false)
    setCountDown(3)
    const intervalId = setInterval(() => {
      setCountDown((prev) => {
        if (prev === 1) {
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
          clearInterval(intervalId)
          return null
        }
        return prev !== null ? prev - 1 : 3
      })
    }, 1000)
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
      {countDown !== null && (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-background/30 backdrop-blur">
          <div className="text-[256px] text-slate-950">{countDown}</div>
        </div>
      )}
      <div className="fixed bottom-8 left-1/2 z-[2147483647] flex -translate-x-1/2 justify-center">
        <div className="flex flex-col items-center space-y-2 ">
          {strokeKeys.slice(-3).map((strokeKey, idx) => (
            <span
              className="rounded-lg bg-background/20 px-4 py-2 text-3xl backdrop-blur delay-1000 transition"
              key={idx}
            >
              {strokeKey}
            </span>
          ))}
        </div>
      </div>
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
                  className="inline-flex items-center space-x-1"
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
                  className="w-48 rounded-md bg-background/60 backdrop-blur"
                  sideOffset={8}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuCheckboxItem
                    checked={audio}
                    onCheckedChange={setAudio}
                  >
                    Audio
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>
                    Show Keystrokes
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>
                    Show Mouse
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    onCheckedChange={handleChangeScrollbarHidden}
                    checked={scrollbarHidden}
                  >
                    Hide Scroll Bar
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2/3 border-l-2 border-slate-950"></div>
            <Button variant="ghost" size="sm" onClick={handleStart}>
              Start
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
