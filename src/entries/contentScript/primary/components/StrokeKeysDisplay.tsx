import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { keyboardCodes } from '~/constants'
import { useStore } from '~/entries/store'
import { isMac, isWindows } from '~/lib/utils'

const clearRecordTimeout = 3000
const metaKey = isMac() ? '⌘' : isWindows() ? '⊞' : 'Meta'

export default function StrokeKeysDisplay() {
  const { recordingMode, area } = useStore((state) => ({
    recordingMode: state.recordingMode,
    area: state.area,
  }))

  const [strokeKeys, setStrokeKeys] = useState<string[]>([])
  const strokeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (strokeTimeoutRef.current) {
      clearTimeout(strokeTimeoutRef.current)
    }

    const keyboardModifiers = {
      Shift: e.shiftKey,
      Control: e.ctrlKey,
      Alt: e.altKey,
      Meta: e.metaKey,
    }
    const activeModifiers = Object.keys(keyboardModifiers).filter(
      (modifier) =>
        keyboardModifiers[modifier as keyof typeof keyboardModifiers],
    )

    const replaceMetaKey = () => {
      if (activeModifiers.includes('Meta')) {
        activeModifiers.splice(activeModifiers.indexOf('Meta'), 1, metaKey)
      }
    }

    if (activeModifiers.includes(e.key)) {
      replaceMetaKey()
      setStrokeKeys(activeModifiers)
    } else {
      replaceMetaKey()
      setStrokeKeys([...activeModifiers, keyboardCodes[e.code] ?? e.code])
    }

    strokeTimeoutRef.current = setTimeout(() => {
      setStrokeKeys([])
    }, clearRecordTimeout)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  useEffect(() => {
    return () => {
      if (strokeTimeoutRef.current) {
        clearTimeout(strokeTimeoutRef.current)
      }
    }
  }, [])

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
        {strokeKeys.map((strokeKey, idx) => (
          <motion.kbd
            key={`${strokeKey}-${idx}`}
            className={clsx(
              'select-none rounded-lg border bg-background/30 px-4 py-2 text-3xl font-semibold text-foreground shadow-[0_2px_0px_1px_hsl(214.3_31.8%_91.4%)] backdrop-blur',
              { 'h-[54px] w-48': strokeKey === ' ' },
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {strokeKey}
          </motion.kbd>
        ))}
      </div>
    </div>
  )
}
