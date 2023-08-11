import { useRef } from 'react'
import { Button } from '~/components/ui/button'

const params = new URLSearchParams(location.search)
const videoUrl = params.get('videoUrl')

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)

  if (!videoUrl) {
    return null
  }

  return (
    <div className="flex h-screen space-x-4 p-20">
      <div className="flex justify-center">
        <video
          className="rounded-lg shadow-md"
          controls
          ref={videoRef}
          src={videoUrl}
          preload="metadata"
        />
      </div>
      <div className="flex w-72 flex-col items-center justify-center p-4">
        <Button
          className="w-24"
          // onClick={() => chrome.offscreen.closeDocument()}
        >
          保存
        </Button>
      </div>
    </div>
  )
}
