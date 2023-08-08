import { openDB } from 'idb'
import { useRef } from 'react'
import { Button } from '~/components/ui/button'

const params = new URLSearchParams(location.search)
const recordingId = params.get('recordingId')

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)

  async function handleClick() {
    if (!recordingId) return
    if (!videoRef.current) return

    const db = await openDB('sgreen')
    const tx = db.transaction('recordings', 'readonly')
    const recording = await tx.store.get(recordingId)
    console.log('------', recording)

    const blob = new Blob(recording.data, { type: recording.type })
    videoRef.current.src = URL.createObjectURL(blob)
  }

  return (
    <div className="flex space-x-4 p-8">
      <div>
        <video className="bg-green-500" controls ref={videoRef} />
      </div>
      <div>
        <Button onClick={handleClick}>Transcode</Button>
      </div>
    </div>
  )
}
