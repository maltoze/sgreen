import React, { useCallback, useState } from 'react'
import { useStore } from '~/entries/store'

const SelectingArea = () => {
  const area = useStore((state) => state.area)

  const [startPos, setStartPos] = useState({ x: area?.x, y: area?.y })
  const [endPos, setEndPos] = useState({
    x: area.x + area.width,
    y: area.y + area.height,
  })

  const [isSelecting, setIsSelecting] = useState(false)

  function handlePointerDown(e: React.PointerEvent) {
    setStartPos({ x: e.clientX, y: e.clientY })
    setEndPos({ x: e.clientX, y: e.clientY })
    setIsSelecting(true)
  }

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isSelecting) {
        setEndPos({ x: e.clientX, y: e.clientY })
      }
    },
    [isSelecting],
  )

  function handlePointerUp() {
    setIsSelecting(false)
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

  return (
    <div
      className="fixed inset-0 z-[2147483645]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        // to prevent clipPath from affecting pointer events during selection
        clipPath: !isSelecting
          ? `polygon(0px 0px, 0px 100%, 100% 100%, 100% 0px, 0px 0px, ${startX}px ${startY}px, ${endX}px ${startY}px, ${endX}px ${endY}px, ${startX}px ${endY}px, ${startX}px ${startY}px, 0px 0px)`
          : undefined,
      }}
    >
      <div
        className="h-full w-full cursor-crosshair bg-background/30 backdrop-blur-sm"
        style={{
          clipPath: `polygon(0px 0px, 0px 100%, 100% 100%, 100% 0px, 0px 0px, ${startX}px ${startY}px, ${endX}px ${startY}px, ${endX}px ${endY}px, ${startX}px ${endY}px, ${startX}px ${startY}px, 0px 0px)`,
        }}
      ></div>
    </div>
  )
}

export default SelectingArea
