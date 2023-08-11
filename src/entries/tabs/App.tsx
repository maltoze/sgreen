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
        className="h-full rounded-lg shadow-xl"
        controls
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
      />
    </main>
  )
}
