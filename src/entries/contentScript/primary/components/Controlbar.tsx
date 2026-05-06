import {
  CaretDownIcon,
  Cross2Icon,
  DesktopIcon,
  MarginIcon,
  PaddingIcon,
} from '@radix-ui/react-icons'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ReactNode, useEffect, useRef, useState } from 'react'
import Draggable from 'react-draggable'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { tabCaptureModes } from '~/constants'
import { useStore } from '~/entries/store'
import { RecordingMode } from '~/types'

interface RecordingModeOption {
  name: RecordingMode
  label: string
  icon: ReactNode
}

interface ControlbarProps {
  appRoot?: ShadowRoot
  onClose: () => void
}

export default function Controlbar({ appRoot, onClose }: ControlbarProps) {
  const {
    audio,
    showKeystrokes,
    scrollbarHidden,
    recordingMode,
    countdown,
    showMouseClicks,
  } = useStore((state) => ({
    audio: state.audio,
    showKeystrokes: state.showKeystrokes,
    scrollbarHidden: state.scrollbarHidden,
    recordingMode: state.recordingMode,
    countdown: state.countdown,
    showMouseClicks: state.showMouseClicks,
  }))

  const recordingModes: RecordingModeOption[] = [
    {
      name: 'area',
      label: 'Area',
      icon: <MarginIcon className="h-5 w-5" />,
    },
    {
      name: 'tab',
      label: 'Current Tab',
      icon: <PaddingIcon className="h-5 w-5" />,
    },
    {
      name: 'desktop',
      label: 'Desktop',
      icon: <DesktopIcon className="h-5 w-5" />,
    },
  ]

  const menuItems = [
    {
      name: 'audio',
      label: 'Enable Audio',
      checked: audio,
      onCheckedChange: (checked: boolean) =>
        useStore.setState({ audio: checked }),
    },
    {
      name: 'showKeystrokes',
      label: 'Show Keystrokes',
      checked: showKeystrokes,
      onCheckedChange: (checked: boolean) =>
        useStore.setState({ showKeystrokes: checked }),
    },
    {
      name: 'showMouseClicks',
      label: 'Show Mouse Clicks',
      checked: showMouseClicks,
      onCheckedChange: (checked: boolean) =>
        useStore.setState({ showMouseClicks: checked }),
    },
    {
      name: 'scrollbarHidden',
      label: 'Hide Scrollbar',
      checked: scrollbarHidden,
      onCheckedChange: (checked: boolean) =>
        useStore.setState({ scrollbarHidden: checked }),
    },
  ]

  function handleStart() {
    switch (recordingMode) {
      case 'area':
      case 'tab':
        useStore.setState({ showCountdown: true })
        break
      default:
        chrome.runtime.sendMessage({
          type: 'start-recording',
          target: 'background',
          data: {
            recordingMode,
          },
        })
        onClose()
        break
    }
  }

  const draggableNodeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerBoundingRect, setContainerBoundingRect] = useState<DOMRect>()

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      const container = containerRef.current
      if (container) {
        setContainerBoundingRect(container.getBoundingClientRect())
      }
    })

    const container = containerRef.current
    if (!container) return
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <Draggable
      cancel="button"
      nodeRef={draggableNodeRef}
      bounds={{
        bottom: 16,
        left: -(
          window.innerWidth / 2 -
          (containerBoundingRect?.width ?? 0) / 2
        ),
        right: window.innerWidth / 2 - (containerBoundingRect?.width ?? 0) / 2,
        top: -(window.innerHeight - (containerBoundingRect?.height ?? 0) - 16),
      }}
    >
      <div
        ref={draggableNodeRef}
        className="fixed bottom-4 left-1/2 z-[2147483646]"
      >
        <motion.div
          className="flex space-x-2 rounded-xl bg-background/50 p-1.5 shadow-[0_1px_2px_0px_rgb(0_0_0_/0.1),0_-1px_2px_-1px_rgb(0_0_0_/0.1)] backdrop-blur"
          ref={containerRef}
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 60, x: '-50%' }}
        >
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Cross2Icon className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Divider />
            {recordingModes.map((mode) => (
              <TooltipProvider key={mode.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        useStore.setState({
                          recordingMode: mode.name,
                        })
                      }
                      className={clsx({
                        'cursor-default text-green-500 hover:bg-transparent hover:text-green-500':
                          mode.name === recordingMode,
                      })}
                    >
                      {mode.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{mode.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Divider />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="inline-flex select-none items-center space-x-1"
                  disabled={!tabCaptureModes.includes(recordingMode)}
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
                  className="z-[2147483647] w-52 rounded-md bg-background/60 backdrop-blur"
                  sideOffset={10}
                  side="top"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {menuItems.map((item) => (
                    <DropdownMenuCheckboxItem
                      checked={item.checked}
                      onCheckedChange={item.onCheckedChange}
                      key={item.name}
                    >
                      {item.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <div className="pl-6">Countdown</div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal
                      // @ts-ignore
                      container={appRoot}
                    >
                      <DropdownMenuSubContent
                        className="z-[2147483647] min-w-[5rem] rounded-md bg-background/60 tabular-nums backdrop-blur"
                        sideOffset={4}
                      >
                        <DropdownMenuRadioGroup
                          value={countdown.toString()}
                          onValueChange={(value) =>
                            useStore.setState({ countdown: parseInt(value) })
                          }
                        >
                          {[0, 1, 3, 5, 7, 10].map((second) => (
                            <DropdownMenuRadioItem
                              key={`countdown-${second}`}
                              value={second.toString()}
                            >
                              {second}s
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
          <div className="flex items-center space-x-2">
            <Divider />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStart}
                    className="select-none"
                  >
                    Start
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start Recording</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>
      </div>
    </Draggable>
  )
}

function Divider() {
  return <div className="h-2/3 border border-slate-950"></div>
}
