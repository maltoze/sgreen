import { openDB } from 'idb'
import { useEffect, useRef } from 'react'
import { Button } from '~/components/ui/button'

const params = new URLSearchParams(location.search)
const recordingId = params.get('recordingId')

async function getRecordingBlob(id: string, type?: string): Promise<Blob> {
  const db = await openDB('sgreen')
  const tx = db.transaction('recordings', 'readonly')
  const recording = await tx.store.get(id)
  return new Blob(recording.data, { type: type ?? recording.type })
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const loadVideo = async () => {
      if (!recordingId) return
      if (!videoRef.current) return

      const blob = await getRecordingBlob(recordingId)
      videoRef.current.src = URL.createObjectURL(blob)
    }
    loadVideo()
  }, [])

  return (
    <div className="flex space-x-4 p-20 h-screen">
      <div className="flex justify-center">
        <video className="h-full rounded" controls ref={videoRef} />
      </div>
      <div className="flex w-72 flex-col items-center justify-center p-4">
        <Button className="w-24">保存</Button>
      </div>
    </div>
  )
}
