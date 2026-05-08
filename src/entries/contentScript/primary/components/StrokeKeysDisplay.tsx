import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { keyboardCodes } from '~/constants'
import { useStore } from '~/entries/store'
import { isMac, isWindows } from '~/lib/utils'

const metaKey = isMac() ? '⌘' : isWindows() ? '⊞' : 'Meta'
const MAX_VISIBLE = 8
const KEY_EXIT_DELAY_SECONDS = 0.5
type StrokeKey = { id: number; code: string }

export default function StrokeKeysDisplay() {
  const { recordingMode, area } = useStore((state) => ({
    recordingMode: state.recordingMode,
    area: state.area,
  }))

  const [strokeKeys, setStrokeKeys] = useState<StrokeKey[]>([])
  const nextStrokeKeyId = useRef(0)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setStrokeKeys((prevKeys) => {
      if (prevKeys.some((key) => key.code === e.code)) {
        return prevKeys
      }
      const next = [
        ...prevKeys,
        { id: nextStrokeKeyId.current++, code: e.code },
      ]
      if (next.length > MAX_VISIBLE) {
        return next.slice(next.length - MAX_VISIBLE)
      }
      return next
    })
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setStrokeKeys((prevKeys) => prevKeys.filter((key) => key.code !== e.code))
  }, [])

  function handleFocus() {
    setStrokeKeys([])
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('focus', handleFocus)
    }
  }, [handleKeyDown, handleKeyUp])

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
      <div className="flex items-center space-x-2">
        <AnimatePresence>
          {strokeKeys.map(({ id, code }) => (
            <motion.kbd
              key={id}
              className={clsx(
                'select-none rounded-lg border bg-background/30 px-4 py-2 text-3xl font-semibold text-foreground shadow-[0_2px_0px_1px_hsl(214.3_31.8%_91.4%)] backdrop-blur',
                { 'h-[54px] w-48': code === 'Space' },
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                transition: { delay: KEY_EXIT_DELAY_SECONDS },
              }}
            >
              {code.startsWith('Meta')
                ? metaKey
                : (keyboardCodes[code] ?? code)}
            </motion.kbd>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
