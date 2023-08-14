import { useRef } from 'react'

const params = new URLSearchParams(location.search)
const videoUrl = params.get('videoUrl')

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)

  if (!videoUrl) {
    return null
  }

  return (
    <main className="bg-video-tab flex h-screen items-center justify-center p-20">
      <video
        className="h-full rounded-lg shadow-[0_4px_6px_-1px_rgb(0_0_0_/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1),0_-2px_4px_-1px_rgb(0_0_0_/0.1)]"
        controls
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
      />
    </main>
  )
}
