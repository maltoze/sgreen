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
    <motion.div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-background/30"
      initial={{ backdropFilter: 'blur(0px)' }}
      animate={{ backdropFilter: 'blur(4px)', transition: { duration: 0.1 } }}
      exit={{ backdropFilter: 'blur(0px)', transition: { duration: 0.3 } }}
    >
      {currentCount > 0 && (
        <motion.div
          className="absolute select-none"
          key={currentCount}
          initial={{ scale: 0.1 }}
          animate={{ scale: 30 }}
        >
          {currentCount}
        </motion.div>
      )}
    </motion.div>
  )
}
