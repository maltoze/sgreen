import { KeyboardIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { setDockVisible, useStore } from './store'

interface IRecordingMode {
  name: string
  label: string
  icon: React.ReactNode
  tooltip: string
  onClick?: () => void
}

function App() {
  const [recording, setRecording] = useState(false)

  const dockVisible = useStore((state) => state.dockVisible)

  async function handleStart() {
    setRecording(true)
    setDockVisible(false)
    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'background',
      data: {
        width: window.innerWidth,
        height: window.innerHeight,
        recordingId: uuidv4(),
      },
    })
  }

  async function handleStop() {
    setRecording(false)
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen',
    })
    setDockVisible(false)
    // send message to background
  }

  if (!dockVisible) {
    return null
  }

  const actions: IRecordingMode[] = [
    {
      name: 'keyboard',
      label: 'Keyboard',
      icon: <KeyboardIcon className="h-4 w-4" />,
      tooltip: 'Keyboard',
    },
  ]

  return (
    <div className="fixed bottom-4 left-4 z-[2147483647] flex space-x-2 rounded-xl bg-green-100/30 p-1.5 text-slate-950 shadow-md backdrop-blur">
      <div className="flex space-x-2">
        {actions.map((action) => (
          <TooltipProvider key={action.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={action.onClick}
                  className="inline-flex flex-col text-xs"
                >
                  {action.icon}
                  {action.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-2/3 border-l-2 border-slate-950"></div>
        {recording ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            className="text-red-600 hover:text-red-700"
          >
            Stop
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleStart}>
            Start
          </Button>
        )}
      </div>
    </div>
  )
}

export default App
