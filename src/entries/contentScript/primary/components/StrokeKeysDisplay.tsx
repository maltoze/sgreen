import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { keyboardCodes } from '~/constants'
import { useStore } from '~/entries/store'
import { getModifierKeyLabel, sortKeysForDisplay } from '~/lib/utils'

export default function StrokeKeysDisplay() {
  const { recordingMode, area } = useStore((state) => ({
    recordingMode: state.recordingMode,
    area: state.area,
  }))

  const [strokeKeys, setStrokeKeys] = useState<string[]>([])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setStrokeKeys((prevKeys) => {
      if (prevKeys.includes(e.code)) {
        return prevKeys
      } else {
        return [...prevKeys, e.code]
      }
    })
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setStrokeKeys((prevKeys) => prevKeys.filter((key) => key !== e.code))
  }, [])

  const handleReset = useCallback(() => {
    setStrokeKeys([])
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('focus', handleReset)
    window.addEventListener('blur', handleReset)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('focus', handleReset)
      window.removeEventListener('blur', handleReset)
    }
  }, [handleKeyDown, handleKeyUp, handleReset])

  const sortedKeys = useMemo(() => sortKeysForDisplay(strokeKeys), [strokeKeys])

  return (
    <div
      className={clsx(
        'fixed z-[2147483647] flex -translate-x-1/2 justify-center',
        {
          'bottom-8 left-1/2': ['desktop', 'tab'].includes(recordingMode),
        },
      )}
      style={{
        bottom:
          recordingMode === 'area'
            ? window.innerHeight - area.y - area.height + 8
            : undefined,
        left: recordingMode === 'area' ? area.x + area.width / 2 : undefined,
      }}
    >
      <AnimatePresence>
        {sortedKeys.length > 0 && (
          <motion.div
            className="flex items-center space-x-2"
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.3 } }}
          >
            {sortedKeys.map((keyCode, idx) => (
              <motion.kbd
                key={`${keyCode}-${idx}`}
                className={clsx(
                  'select-none rounded-lg border bg-background/30 px-4 py-2 text-3xl font-semibold text-foreground shadow-[0_2px_0px_1px_hsl(214.3_31.8%_91.4%)] backdrop-blur',
                  { 'h-[54px] w-48': keyCode === 'Space' },
                )}
                animate={{ opacity: 1 }}
              >
                {getModifierKeyLabel(keyCode) ??
                  keyboardCodes[keyCode] ??
                  keyCode}
              </motion.kbd>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
