import { FFmpeg } from '@ffmpeg/ffmpeg'
import { openDB } from 'idb'
import { useRef } from 'react'
import { Button } from '~/components/ui/button'
import { setFFmpegLoaded, useStore } from './store'

const params = new URLSearchParams(location.search)
const recordingId = params.get('recordingId')

const ffmpeg = new FFmpeg()
async function loadFFmpeg() {
  await ffmpeg.load({
    coreURL: new URL('/ffmpeg-core.js', import.meta.url).toString(),
    wasmURL: new URL('/ffmpeg-core.wasm', import.meta.url).toString(),
  })
  setFFmpegLoaded(true)
}
loadFFmpeg()
console.log(new URL('/ffmpeg-core.js', import.meta.url).toString())

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const ffmpegLoaded = useStore((state) => state.ffmpegLoaded)

  async function handleClick() {
    if (!recordingId) return
    const db = await openDB('sgreen')
    const tx = db.transaction('recordings', 'readonly')
    const recording = await tx.store.get(recordingId)
    console.log('------', recording)

    const rdata: Blob[] = recording.data
    const blob = new Blob(rdata, { type: recording.type })
    const arrayBuffer = await blob.arrayBuffer()
    console.log('----here----', ffmpeg)
    await ffmpeg.writeFile('input.webm', new Uint8Array(arrayBuffer))
    console.log('----write file-------')
    await ffmpeg.exec(['-i', 'input.webm', 'output.mp4'])
    console.log('----exec-------')
    const data = await ffmpeg.readFile('output.mp4')
    window.open(
      URL.createObjectURL(new Blob([data], { type: 'video/mp4' })),
      '_blank',
    )
  }

  return (
    <div className="flex space-x-4 p-8">
      <div>
        <video className="bg-green-500" controls ref={videoRef} />
      </div>
      <div>
        <Button onClick={handleClick} disabled={!ffmpegLoaded}>
          Transcode
        </Button>
      </div>
    </div>
  )
}
