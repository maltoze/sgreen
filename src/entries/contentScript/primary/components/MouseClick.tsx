import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function MouseClick() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPointerDown, setIsPointerDown] = useState(false)

  function handleClick(e: MouseEvent) {
    setPosition({ x: e.clientX, y: e.clientY })
    setIsPointerDown(true)
  }

  useEffect(() => {
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <AnimatePresence>
      {isPointerDown && (
        <motion.div
          className="pointer-events-none fixed z-[2147483647] h-4 w-4 rounded-full bg-green-500/50"
          style={{ left: position.x, top: position.y }}
          initial={{
            scale: 0,
            opacity: 0,
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{ scale: 3, opacity: 1, transition: { duration: 0 } }}
          exit={{ scale: 0, opacity: 0, transition: { duration: 0.5, ease: 'linear' } }}
          onAnimationComplete={() => {
            setIsPointerDown(false)
          }}
        ></motion.div>
      )}
    </AnimatePresence>
  )
}
