import { useEffect } from 'react'

const style = document.createElement('style')
document.head.appendChild(style)

function hideScrollBar() {
  style.sheet?.insertRule(
    `
    ::-webkit-scrollbar {
      display: none;
    }
  `,
    0,
  )
}

function deleteRule() {
  if (style.sheet?.cssRules.length && style.sheet?.cssRules.length > 0) {
    style.sheet?.deleteRule(0)
  }
}

interface Props {
  scrollbarHidden: boolean
  isRecording: boolean
}

export default function useScrollbar({ scrollbarHidden, isRecording }: Props) {
  useEffect(() => {
    if (scrollbarHidden && isRecording) {
      hideScrollBar()
    }
    return () => {
      deleteRule()
    }
  }, [isRecording, scrollbarHidden])
}
