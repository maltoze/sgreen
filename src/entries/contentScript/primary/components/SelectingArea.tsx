import clsx from 'clsx'
import React, { useState } from 'react'
import { useStore } from '~/entries/store'

const outlineWidth = 0

const SelectingArea = () => {
  const { isRecording, area } = useStore((state) => ({
    area: state.area,
    isRecording: state.isRecording,
  }))

  const [startPos, setStartPos] = useState({ x: area?.x, y: area?.y })
  const [endPos, setEndPos] = useState({
    x: area.x + area.width,
    y: area.y + area.height,
  })

  const [isSelecting, setIsSelecting] = useState(false)
  const [isGrabbing, setIsGrabbing] = useState(false)

  const [startGrabPos, setStartGrabPos] = useState({ x: 0, y: 0 })

  function handleAreaPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return
    setIsGrabbing(true)
    setStartGrabPos({ x: e.clientX, y: e.clientY })
  }

  function handleAreaPointerMove(e: React.PointerEvent) {
    if (isGrabbing) {
      setStartPos({
        x: startPos.x + e.clientX - startGrabPos.x,
        y: startPos.y + e.clientY - startGrabPos.y,
      })
      setEndPos({
        x: endPos.x + e.clientX - startGrabPos.x,
        y: endPos.y + e.clientY - startGrabPos.y,
      })
      setStartGrabPos({ x: e.clientX, y: e.clientY })
    }
  }

  function handleAreaPointerUp(_e: React.PointerEvent) {
    setIsGrabbing(false)
    useStore.setState({
      area: {
        x: Math.min(startPos.x, endPos.x),
        y: Math.min(startPos.y, endPos.y),
        width: Math.abs(startPos.x - endPos.x),
        height: Math.abs(startPos.y - endPos.y),
      },
    })
  }

  function handlePointerDown(e: React.PointerEvent) {
    // Only left click
    if (e.button !== 0) return

    setStartPos({ x: e.clientX, y: e.clientY })
    setEndPos({ x: e.clientX, y: e.clientY })
    setIsSelecting(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (isSelecting) {
      setEndPos({ x: e.clientX, y: e.clientY })
    }

    if (isGrabbing) {
      setStartPos({
        x: startPos.x + e.clientX - startGrabPos.x,
        y: startPos.y + e.clientY - startGrabPos.y,
      })
      setEndPos({
        x: endPos.x + e.clientX - startGrabPos.x,
        y: endPos.y + e.clientY - startGrabPos.y,
      })
      setStartGrabPos({ x: e.clientX, y: e.clientY })
    }
  }

  function handlePointerUp() {
    setIsSelecting(false)
    setIsGrabbing(false)
    useStore.setState({
      area: {
        x: Math.min(startPos.x, endPos.x),
        y: Math.min(startPos.y, endPos.y),
        width: Math.abs(startPos.x - endPos.x),
        height: Math.abs(startPos.y - endPos.y),
      },
    })
  }

  const startX = Math.min(startPos.x, endPos.x)
  const startY = Math.min(startPos.y, endPos.y)
  const endX = Math.max(startPos.x, endPos.x)
  const endY = Math.max(startPos.y, endPos.y)

  function handleOnContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setStartPos({ x: 0, y: 0 })
    setEndPos({ x: 0, y: 0 })
  }

  return (
    <>
      <div
        className={clsx('fixed inset-0 z-[2147483645]', {
          'pointer-events-none': isRecording,
        })}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={handleOnContextMenu}
        style={{
          // to prevent clipPath from affecting pointer events during selection
          clipPath: !isSelecting
            ? `polygon(0px 0px, 0px 100%, 100% 100%, 100% 0px, 0px 0px, ${startX}px ${startY}px, ${endX}px ${startY}px, ${endX}px ${endY}px, ${startX}px ${endY}px, ${startX}px ${startY}px, 0px 0px)`
            : undefined,
        }}
      >
        <div
          className="h-full w-full cursor-crosshair bg-foreground/60"
          style={{
            clipPath: `polygon(0px 0px, 0px 100%, 100% 100%, 100% 0px, 0px 0px, ${
              startX - outlineWidth
            }px ${startY - outlineWidth}px, ${endX + outlineWidth}px ${
              startY - outlineWidth
            }px, ${endX + outlineWidth}px ${endY + outlineWidth}px, ${
              startX - outlineWidth
            }px ${endY + outlineWidth}px, ${startX - outlineWidth}px ${
              startY - outlineWidth
            }px, 0px 0px)`,
          }}
        ></div>
      </div>
      <div
        className={clsx(
          'fixed left-0 top-0 z-[2147483645] outline-dashed outline-2 outline-background',
          {
            'pointer-events-none': isSelecting || isRecording,
            'cursor-grab': !isGrabbing,
            'pointer-events-auto cursor-grabbing': isGrabbing,
          }
        )}
        onPointerDown={handleAreaPointerDown}
        onPointerMove={handleAreaPointerMove}
        onPointerUp={handleAreaPointerUp}
        onDragStart={(e) => {
          e.preventDefault()
        }}
        style={{
          transform: `translate(${startX}px, ${startY}px)`,
          width: `${endX - startX}px`,
          height: `${endY - startY}px`,
        }}
      ></div>
    </>
  )
}

export default SelectingArea
