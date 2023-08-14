import {
  CaretDownIcon,
  DashboardIcon,
  DesktopIcon,
  PaddingIcon,
} from '@radix-ui/react-icons'
import clsx from 'clsx'
import { ReactNode, useState } from 'react'
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
import { useStore } from '~/entries/store'
import { RecordingMode } from '~/types'

interface RecordingModeOption {
  name: RecordingMode
  label: string
  icon: ReactNode
}

export default function Controlbar() {
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('tab')
  const { audio, showKeystrokes, scrollbarHidden } = useStore((state) => ({
    audio: state.audio,
    showKeystrokes: state.showKeystrokes,
    scrollbarHidden: state.scrollbarHidden,
  }))

  const recordingModes: RecordingModeOption[] = [
    {
      name: 'tab',
      label: 'Current Tab',
      icon: <PaddingIcon className="h-6 w-6" />,
    },
    {
      name: 'desktop',
      label: 'Desktop',
      icon: <DesktopIcon className="h-6 w-6" />,
    },
    {
      name: 'application',
      label: 'Apps',
      icon: <DashboardIcon className="h-6 w-6" />,
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
    useStore.setState({ showCountdown: true })
  }

  return (
    <div className="fixed bottom-4 left-4 z-[2147483646] flex space-x-2 rounded-xl bg-background/40 p-1.5 shadow-md backdrop-blur">
      <div className="flex space-x-2">
        {recordingModes.map((mode) => (
          <TooltipProvider key={mode.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecordingMode(mode.name)}
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
        <div className="h-2/3 border border-primary"></div>
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
              {menuItems.map((item) => (
                <DropdownMenuCheckboxItem
                  checked={item.checked}
                  onCheckedChange={item.onCheckedChange}
                  key={item.name}
                >
                  Enable Audio
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-2/3 border border-primary"></div>
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
  )
}
