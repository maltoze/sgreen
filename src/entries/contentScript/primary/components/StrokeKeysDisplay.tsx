import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useStore } from '~/entries/store'

interface StrokeKeysDisplayProps {
  strokeKeys: string[]
}

export default function StrokeKeysDisplay({
  strokeKeys,
}: StrokeKeysDisplayProps) {
  const { recordingMode, area } = useStore((state) => ({
    recordingMode: state.recordingMode,
    area: state.area,
  }))

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
