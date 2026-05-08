import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { keyboardCodes } from '~/constants'
import { useStore } from '~/entries/store'
import { isMac, isWindows } from '~/lib/utils'

const metaKey = isMac() ? '⌘' : isWindows() ? '⊞' : 'Meta'
const MAX_VISIBLE = 8

export default function StrokeKeysDisplay() {
  const { recordingMode, area } = useStore((state) => ({
    recordingMode: state.recordingMode,
    area: state.area,
  }))

  const [strokeKeys, setStrokeKeys] = useState<string[]>([])
  const heldKeys = useRef<Set<string>>(new Set())
  const clearTimer = useRef<ReturnType<typeof setTimeout>>()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) {
      return
    }

    clearTimeout(clearTimer.current)
    heldKeys.current.add(e.code)
    setStrokeKeys((prevKeys) => {
      const next = [...prevKeys, e.code]
      if (next.length > MAX_VISIBLE) {
        return next.slice(next.length - MAX_VISIBLE)
      }
      return next
    })
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    heldKeys.current.delete(e.code)
    if (heldKeys.current.size === 0) {
      clearTimer.current = setTimeout(() => {
        setStrokeKeys([])
      }, 500)
    }
  }, [])

  function handleFocus() {
    clearTimeout(clearTimer.current)
    heldKeys.current.clear()
    setStrokeKeys([])
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('focus', handleFocus)
    return () => {
      clearTimeout(clearTimer.current)
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
      {strokeKeys.length > 0 && (
        <div className="flex items-center space-x-2">
          {strokeKeys.map((strokeKey, idx) => (
            <kbd
              key={`${strokeKey}-${idx}`}
              className={clsx(
                'select-none rounded-lg border bg-background/30 px-4 py-2 text-3xl font-semibold text-foreground shadow-[0_2px_0px_1px_hsl(214.3_31.8%_91.4%)] backdrop-blur',
                { 'h-[54px] w-48': strokeKey === 'Space' },
              )}
            >
              {strokeKey.startsWith('Meta')
                ? metaKey
                : (keyboardCodes[strokeKey] ?? strokeKey)}
            </kbd>
          ))}
        </div>
      )}
    </div>
  )
}
