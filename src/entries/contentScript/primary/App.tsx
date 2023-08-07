import {
  DashboardIcon,
  DesktopIcon,
  EnterFullScreenIcon,
} from '@radix-ui/react-icons'
import clsx from 'clsx'
import Konva from 'konva'
import { useRef, useState } from 'react'
import { Layer, Rect, Stage } from 'react-konva'
import { v4 as uuidv4 } from 'uuid'
import WindowIcon from '~/components/icons/WindowIcon'
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
  icon: React.ReactNode
  tooltip: string
  onClick?: () => void
}

type RecordMode = 'area' | 'full-window' | 'full-screen' | 'app'

function App() {
  const [recordMode, setRecordMode] = useState<RecordMode | null>(null)
  const isSelectingRef = useRef(false)
  const [beginPos, setBeginPos] = useState<Konva.Vector2d | null>(null)
  const [endPos, setEndPos] = useState<Konva.Vector2d | null>(null)
  const [recording, setRecording] = useState(false)

  const dockVisible = useStore((state) => state.dockVisible)

  function handleSelectArea() {
    setBeginPos(null)
    setEndPos(null)
    setRecordMode((prevMode) => (prevMode === 'area' ? null : 'area'))
  }

  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    // left click
    if (e.evt.button !== 0) {
      return
    }
    isSelectingRef.current = true
    setEndPos(null)
    const pos = e.target.getStage()?.getPointerPosition()
    if (pos) {
      setBeginPos(pos)
    }
  }

  function handleStageMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isSelectingRef.current) {
      return
    }
    const pos = e.target.getStage()?.getPointerPosition()
    if (pos) {
      setEndPos(pos)
    }
  }

  function handleStageMouseUp() {
    isSelectingRef.current = false
  }

  const selectAreaWidth =
    endPos && beginPos ? Math.abs(endPos?.x - beginPos?.x) : 0
  const selectAreaHeight =
    endPos && beginPos ? Math.abs(endPos?.y - beginPos?.y) : 0
  const selectAreaX = endPos && beginPos ? Math.min(endPos?.x, beginPos?.x) : 0
  const selectAreaY = endPos && beginPos ? Math.min(endPos?.y, beginPos?.y) : 0

  async function handleStart() {
    setRecording(true)
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

  function handleStageOnContextMenu(e: Konva.KonvaEventObject<MouseEvent>) {
    e.evt.preventDefault()
    setRecordMode(null)
  }

  if (!dockVisible) {
    return null
  }

  const recordingModes: IRecordingMode[] = [
    {
      name: 'area',
      icon: <EnterFullScreenIcon className="h-4 w-4" />,
      tooltip: 'Select area',
      onClick: handleSelectArea,
    },
    {
      name: 'full-window',
      icon: <WindowIcon className="h-[18px] w-[18px]" />,
      tooltip: 'Full window',
    },
    {
      name: 'full-screen',
      icon: <DesktopIcon className="h-4 w-4" />,
      tooltip: 'Full screen',
    },
    {
      name: 'app',
      icon: <DashboardIcon className="h-4 w-4" />,
      tooltip: 'Apps',
    },
  ]

  return (
    <>
      {recordMode === 'area' && (
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          className="fixed inset-0 z-[2147483646] cursor-crosshair"
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onContextMenu={handleStageOnContextMenu}
        >
          <Layer>
            <Rect
              fill="#020617"
              opacity={0.4}
              width={window.innerWidth}
              height={window.innerHeight}
              x={0}
              y={0}
            />
            <Rect
              x={selectAreaX}
              y={selectAreaY}
              cornerRadius={4}
              width={selectAreaWidth}
              height={selectAreaHeight}
              fill="white"
              globalCompositeOperation="destination-out"
            />
          </Layer>
        </Stage>
      )}
      <div className="fixed bottom-4 left-4 z-[2147483647] flex space-x-2 rounded-xl bg-green-100/30 p-1.5 text-slate-950 shadow-md backdrop-blur">
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
                      'stroke-green-500': recordMode === mode.name,
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
          {recording ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              className="text-red-600"
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
    </>
  )
}

export default App
