import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'

export default function MouseClick() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPointerDown, setIsPointerDown] = useState(false)

  function handlePointerDown(e: PointerEvent) {
    setPosition({ x: e.clientX, y: e.clientY })
    setIsPointerDown(true)
  }

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (isPointerDown) {
        setPosition({ x: e.clientX, y: e.clientY })
      }
    },
    [isPointerDown]
  )

  function handlePointerUp(_e: PointerEvent | DragEvent) {
    setIsPointerDown(false)
  }

  useEffect(() => {
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('dragstart', handlePointerUp)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('dragstart', handlePointerUp)
    }
  }, [handlePointerMove])

  return (
    <AnimatePresence>
      {isPointerDown && (
        <motion.div
          className="pointer-events-none fixed z-[2147483647] h-4 w-4 rounded-full bg-primary/60"
          style={{ left: position.x, top: position.y }}
          initial={{
            scale: 0,
            opacity: 0,
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{ scale: 2, opacity: 1, transition: { duration: 0 } }}
          exit={{
            scale: 0,
            opacity: 0,
            transition: { duration: 0.3, ease: 'linear' },
          }}
        ></motion.div>
      )}
    </AnimatePresence>
  )
}
