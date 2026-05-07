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
import { sendMessage } from '~/lib/utils'
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
      icon: <MarginIcon className="h-4 w-4" />,
    },
    {
      name: 'tab',
      label: 'Current Tab',
      icon: <PaddingIcon className="h-4 w-4" />,
    },
    {
      name: 'desktop',
      label: 'Desktop',
      icon: <DesktopIcon className="h-4 w-4" />,
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
        sendMessage({
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
      requestAnimationFrame(() => {
        const container = containerRef.current
        if (container) {
          setContainerBoundingRect(container.getBoundingClientRect())
        }
      })
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
          className="flex items-center gap-1 rounded-full bg-neutral-900/80 px-2 py-1.5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          ref={containerRef}
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 60, x: '-50%' }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full text-white/75 hover:bg-white/10 hover:text-white"
                >
                  <Cross2Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Divider />
          {recordingModes.map((mode) => {
            const isActive = mode.name === recordingMode
            return (
              <Button
                key={mode.name}
                variant="ghost"
                size="sm"
                onClick={() => useStore.setState({ recordingMode: mode.name })}
                className={clsx(
                  'gap-1.5 rounded-full text-white/75 hover:bg-white/10 hover:text-white',
                  isActive &&
                    'bg-white/15 text-white [&_svg]:text-green-400 hover:bg-white/15',
                )}
              >
                {mode.icon}
                <span className="text-xs font-medium">{mode.label}</span>
              </Button>
            )
          })}
          <Divider />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                disabled={!tabCaptureModes.includes(recordingMode)}
              >
                <span>Options</span>
                <CaretDownIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal container={appRoot}>
              <DropdownMenuContent
                className="z-[2147483647] w-52 rounded-xl border border-white/10 bg-neutral-900/80 backdrop-blur-md"
                sideOffset={10}
                side="top"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {menuItems.map((item) => (
                  <DropdownMenuCheckboxItem
                    checked={item.checked}
                    onCheckedChange={item.onCheckedChange}
                    key={item.name}
                    className="text-white/85 focus:bg-white/10 focus:text-white [&_.text-accent-foreground]:!text-white"
                  >
                    {item.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-white/85 focus:bg-white/10 focus:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white">
                    <div className="pl-6">Countdown</div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal container={appRoot}>
                    <DropdownMenuSubContent
                      className="z-[2147483647] min-w-[5rem] rounded-xl border border-white/10 bg-neutral-900/80 tabular-nums backdrop-blur-md"
                      sideOffset={4}
                    >
                      <DropdownMenuRadioGroup
                        value={countdown.toString()}
                        onValueChange={(value) => {
                          const nextCountdown = Number.parseInt(value, 10)
                          if (Number.isNaN(nextCountdown)) return

                          useStore.setState({ countdown: nextCountdown })
                        }}
                      >
                        {[0, 1, 3, 5, 7, 10].map((second) => (
                          <DropdownMenuRadioItem
                            key={`countdown-${second}`}
                            value={second.toString()}
                            className="text-white/85 focus:bg-white/10 focus:text-white"
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
          <Divider />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStart}
            className="gap-1.5 rounded-full text-white/80 hover:bg-red-500/15 hover:text-white"
          >
            <span className="size-2 rounded-full bg-red-500" />
            Start
          </Button>
        </motion.div>
      </div>
    </Draggable>
  )
}

function Divider() {
  return <div className="mx-1 h-6 border-l border-white/15" />
}
