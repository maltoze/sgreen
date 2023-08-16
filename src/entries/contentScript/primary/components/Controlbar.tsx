import {
  CaretDownIcon,
  Cross2Icon,
  DashboardIcon,
  DesktopIcon,
  PaddingIcon,
} from '@radix-ui/react-icons'
import clsx from 'clsx'
import { ReactNode } from 'react'
import Draggable from 'react-draggable'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
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
import { useStore } from '~/entries/store'
import { RecordingMode } from '~/types'

interface RecordingModeOption {
  name: RecordingMode
  label: string
  icon: ReactNode
}

interface ControlbarProps {
  appRoot: ShadowRoot
  onClose: () => void
}

export default function Controlbar({ appRoot, onClose }: ControlbarProps) {
  const { audio, showKeystrokes, scrollbarHidden, recordingMode } = useStore(
    (state) => ({
      audio: state.audio,
      showKeystrokes: state.showKeystrokes,
      scrollbarHidden: state.scrollbarHidden,
      recordingMode: state.recordingMode,
    }),
  )

  const recordingModes: RecordingModeOption[] = [
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
    {
      name: 'application',
      label: 'Apps',
      icon: <DashboardIcon className="h-5 w-5" />,
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
      name: 'scrollbarHidden',
      label: 'Hide Scrollbar',
      checked: scrollbarHidden,
      onCheckedChange: (checked: boolean) =>
        useStore.setState({ scrollbarHidden: checked }),
    },
  ]

  function handleStart() {
    if (recordingMode === 'tab') {
      useStore.setState({ showCountdown: true })
    } else {
      chrome.runtime.sendMessage({
        type: 'start-recording',
        target: 'background',
        data: {
          recordingMode,
        },
      })
      onClose()
    }
  }

  return (
    <Draggable cancel="button">
      <span className="fixed bottom-4 left-1/2 z-[2147483646]">
        <div className="flex -translate-x-1/2 space-x-2 rounded-xl bg-background/50 p-1.5 shadow-[0_1px_2px_0px_rgb(0_0_0_/0.1),0_-1px_2px_-1px_rgb(0_0_0_/0.1)] backdrop-blur">
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
                        useStore.setState({ recordingMode: mode.name })
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
                  disabled={recordingMode !== 'tab'}
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
                        className="z-[2147483647] rounded-md bg-background/60 backdrop-blur tabular-nums min-w-[4rem]"
                        sideOffset={4}
                      >
                        <DropdownMenuItem>0s</DropdownMenuItem>
                        <DropdownMenuItem>1s</DropdownMenuItem>
                        <DropdownMenuItem>3s</DropdownMenuItem>
                        <DropdownMenuItem>5s</DropdownMenuItem>
                        <DropdownMenuItem>7s</DropdownMenuItem>
                        <DropdownMenuItem>10s</DropdownMenuItem>
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
        </div>
      </span>
    </Draggable>
  )
}

function Divider() {
  return <div className="h-2/3 border border-slate-950"></div>
}
