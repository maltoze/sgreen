import { motion } from 'framer-motion'

interface StrokeKeysDisplayProps {
  strokeKeys: string[]
}

export default function StrokeKeysDisplay({
  strokeKeys,
}: StrokeKeysDisplayProps) {
  return (
    <div className="fixed bottom-8 left-1/2 z-[2147483647] flex -translate-x-1/2 justify-center">
      <div className="flex items-center space-x-2">
        {strokeKeys.map((strokeKey, idx) => (
          <motion.kbd
            key={`${strokeKey}-${idx}`}
            className="select-none rounded-lg border bg-background/30 px-4 py-2 text-3xl font-semibold shadow-[0_2px_0px_1px_hsl(214.3_31.8%_91.4%)] backdrop-blur"
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
