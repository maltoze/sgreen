import { useRef } from 'react'
import Confetti from 'react-confetti'

const params = new URLSearchParams(location.search)
const videoUrl = params.get('videoUrl')

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)

  if (!videoUrl) {
    return null
  }

  return (
    <>
      <Confetti recycle={false} gravity={0.5} numberOfPieces={300} />
      <main className="flex h-screen items-center justify-center bg-gradient-to-tr from-purple-100 via-green-50 to-pink-100 p-10 lg:p-20">
        <video
          className="max-h-full rounded-lg shadow-[0_4px_6px_-1px_rgb(0_0_0_/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1),0_-2px_4px_-1px_rgb(0_0_0_/0.1)]"
          controls
          ref={videoRef}
          src={videoUrl}
          preload="metadata"
        />
      </main>
    </>
  )
}
