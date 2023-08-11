import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface CountdownProps {
  count: number
  onFinish: () => void
}

export default function Countdown({ count, onFinish }: CountdownProps) {
  const [currentCount, setCurrentCount] = useState(count)
  const intervalIdRef = useRef<number>()

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentCount((prev) => prev - 1)
    }, 1000)

    intervalIdRef.current = id

    return () => clearInterval(id)
  }, [count, onFinish])

  useEffect(() => {
    if (currentCount === 0) {
      onFinish()
      clearInterval(intervalIdRef.current)
    }
  }, [currentCount, onFinish])

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-background/30 backdrop-blur">
      {currentCount > 0 && (
        <motion.div
          className="absolute select-none"
          key={currentCount}
          initial={{ scale: 1 }}
          animate={{
            scale: 20,
            transition: { duration: 0.5, ease: 'easeInOut' },
          }}
        >
          {currentCount}
        </motion.div>
      )}
    </div>
  )
}
