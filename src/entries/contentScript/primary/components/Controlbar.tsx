import {
  CaretDownIcon,
  Cross2Icon,
  DesktopIcon,
  MarginIcon,
  PaddingIcon,
  VideoIcon,
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
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from '~/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Switch } from '~/components/ui/switch'
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
    enableBackground,
  } = useStore((state) => ({
    audio: state.audio,
    showKeystrokes: state.showKeystrokes,
    scrollbarHidden: state.scrollbarHidden,
    recordingMode: state.recordingMode,
    countdown: state.countdown,
    showMouseClicks: state.showMouseClicks,
    enableBackground: state.enableBackground,
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
    const container = containerRef.current
    if (container) {
      setContainerBoundingRect(container.getBoundingClientRect())
    }
  }, [])

  return (
    <Draggable
      cancel="button"
      nodeRef={draggableNodeRef}
      bounds={{
        // bottom-4
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  Style
                </Button>
              </PopoverTrigger>
              <PopoverPortal
                // @ts-ignore
                container={appRoot}
              >
                <PopoverContent
                  sideOffset={10}
                  side="top"
                  className="z-[2147483647] space-y-4 bg-background/50 backdrop-blur"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="enable-background">Background</Label>
                      <Switch
                        id="enable-background"
                        checked={enableBackground}
                        onCheckedChange={(value) => {
                          useStore.setState({ enableBackground: value })
                        }}
                      />
                    </div>
                    {enableBackground && (
                      <div className="flex space-x-4">
                        <RadioGroup
                          className="grid grid-cols-3 gap-2"
                          defaultValue="tab"
                        >
                          <Label
                            htmlFor="bg-0"
                            className="border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                          >
                            <RadioGroupItem
                              className="sr-only"
                              id="bg-0"
                              value="bg-0"
                            />
                            <div className="h-5 w-5 bg-gradient-to-br from-violet-700 to-purple-700 shadow"></div>
                          </Label>
                          <Label
                            htmlFor="bg-1"
                            className="border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                          >
                            <RadioGroupItem
                              className="sr-only"
                              id="bg-1"
                              value="bg-1"
                            />
                            <div className="h-5 w-5 bg-gradient-to-br from-violet-700 to-fuchsia-700 shadow"></div>
                          </Label>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="flex justify-center">
                      <div className="relative flex items-center justify-center rounded-md bg-gradient-to-br from-violet-700 to-purple-700 px-5 py-3 shadow">
                        <VideoIcon className="absolute h-5 w-5" />
                        <div className="flex flex-col space-y-0.5 rounded bg-blue-200 px-2 py-1.5 shadow">
                          <div className="h-1 w-9 rounded bg-background/50"></div>
                          <div className="h-1 w-5 rounded bg-background/50"></div>
                          <div className="h-1 w-12 rounded bg-background/50"></div>
                          <div className="h-1 w-8 rounded bg-background/50"></div>
                          <div className="h-1 w-16 rounded bg-background/50"></div>
                          <div className="h-1 w-10 rounded bg-background/50"></div>
                          <div className="h-1 w-8 rounded bg-background/50"></div>
                          <div className="h-1 w-14 rounded bg-background/50"></div>
                          <div className="h-1 w-10 rounded bg-background/50"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </PopoverPortal>
            </Popover>
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
